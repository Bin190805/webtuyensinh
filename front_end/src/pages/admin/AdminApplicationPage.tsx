import React, { useState, useEffect } from 'react';
import {App, Table, Tag, Space, Button, Typography, Pagination, Select, Row, Col, notification, Tooltip, Modal, Spin, Input, DatePicker, Card, Descriptions, Image, Divider } from 'antd';
import type { TableProps } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';

import { 
  getAdminApplicationsAPI, 
  updateApplicationStatusAPI, 
  getApplicationDetailsByAdminAPI,
  PaginatedAdminApplicationResponse, 
  AdminApplicationListItem,
  ApplicationDetail,
  ExtraDocument
} from '../../services/adminApplicationService'; 
import { getAllSchoolsAPI, getMajorsBySchoolAPI } from '../../services/applicationService'; 
import '../../styles/AdminApplicationPage.css'; // File CSS riêng cho trang Admin
import type { Dayjs } from 'dayjs';

// Thêm 'Paragraph' vào đây
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminApplicationsPage: React.FC = () => {
    const { message, notification } = App.useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [apiResponse, setApiResponse] = useState<PaginatedAdminApplicationResponse | null>(null);
  const [queryParams, setQueryParams] = useState({
    page: 1, limit: 10,
    search: undefined as string | undefined,
    status: undefined as string | undefined,
    schoolCode: undefined as string | undefined,
    majorCode: undefined as string | undefined,
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
  });

  // State cho dữ liệu của các bộ lọc
  const [schools, setSchools] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);

  // State cho Modal chi tiết
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null);

  // --- SỬA LỖI: SỬ DỤNG HOOK useModal ---
  const [modal, contextHolder] = Modal.useModal();
  // ------------------------------------

  // Hàm fetch danh sách hồ sơ
  const fetchApplications = async () => {
    setLoading(true);
    const params: any = { ...queryParams };
    Object.keys(params).forEach(key => (params[key] === undefined || params[key] === '' || params[key] === null) && delete params[key]);

    try {
      const response = await getAdminApplicationsAPI(params);
      setApiResponse(response);
    } catch (error) {
      notification.error({ message: 'Lỗi', description: 'Không thể tải danh sách hồ sơ.' });
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu trường học cho bộ lọc khi component được mount
  useEffect(() => {
    getAllSchoolsAPI().then(setSchools).catch(() => notification.error({ message: 'Lỗi tải danh sách trường' }));
  }, []);

  // Gọi API mỗi khi queryParams thay đổi (có debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchApplications();
    }, 500);
    return () => clearTimeout(handler);
  }, [queryParams]);
  
  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (key: string, value: any) => {
    const newParams = { ...queryParams, page: 1, [key]: value || undefined };
    if (key === 'schoolCode') {
      newParams.majorCode = undefined; // Reset ngành khi đổi trường
      setMajors([]);
      if (value) {
        getMajorsBySchoolAPI(value).then(setMajors);
      }
    }
    setQueryParams(newParams);
  };
  
  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setQueryParams(prev => ({ ...prev, page: 1, dateFrom: dates?.[0]?.format('YYYY-MM-DD'), dateTo: dates?.[1]?.format('YYYY-MM-DD') }));
  };

  // Xử lý các hành động của Admin
  const handleUpdateStatus = async (applicationCode: string, newStatus: 'APPROVED' | 'CANCEL') => {
    const statusText = newStatus === 'APPROVED' ? 'Đã duyệt' : 'Từ chối';
    
    // --- SỬA LỖI: SỬ DỤNG INSTANCE `modal` THAY VÌ `Modal` ---
    modal.confirm({
      title: `Xác nhận ${statusText} hồ sơ`,
      content: `Bạn có chắc chắn muốn ${statusText.toLowerCase()} hồ sơ có mã ${applicationCode}?`,
      okText: `Đồng ý`, okType: newStatus === 'CANCEL' ? 'danger' : 'primary', cancelText: 'Hủy',
      onOk: async () => {
        console.log("Hàm onOk đã được gọi!"); // Log của bạn sẽ hiển thị ở đây
        try {
          await updateApplicationStatusAPI(applicationCode, statusText);
          notification.success({ message: `${statusText} hồ sơ thành công!` });
          fetchApplications(); // Tải lại danh sách
        } catch (error) {
          notification.error({ message: 'Cập nhật thất bại' });
        }
      },
    });
  };

  const handleViewDetails = async (applicationCode: string) => {
    setIsModalVisible(true); setDetailLoading(true);
    try {
      const response = await getApplicationDetailsByAdminAPI(applicationCode);
      setSelectedApplication(response);
    } catch (error) {
      notification.error({ message: 'Lỗi', description: 'Không thể tải chi tiết hồ sơ.' });
      setIsModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusDetails = (status: string): { text: string; color: string } => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return { text: 'Chờ duyệt', color: 'blue' };
      case 'APPROVED': return { text: 'Đã duyệt', color: 'green' };
      case 'CANCEL': return { text: 'Từ chối', color: 'red' };
      default: return { text: status, color: 'default' };
    }
  };

  const columns: TableProps<AdminApplicationListItem>['columns'] = [
    { title: 'STT', key: 'index', render: (_, __, index) => (queryParams.page - 1) * queryParams.limit + index + 1, align: 'center', width: '5%' },
    { title: 'Mã hồ sơ', dataIndex: 'applicationCode', key: 'applicationCode', width: '15%' },
    { title: 'Trường ĐK', dataIndex: 'schoolName', key: 'schoolName', width: '25%' },
    { title: 'Trạng thái', key: 'status', dataIndex: 'status', align: 'center', width: '15%', render: (status) => { const { text, color } = getStatusDetails(status); return <Tag color={color}>{text.toUpperCase()}</Tag>; } },
    { 
      title: 'Hành động', 
      key: 'action', 
      align: 'center', 
      width: '20%', 
      render: (_, record: AdminApplicationListItem) => {
        const canModify = record.status?.trim().toUpperCase() === 'PENDING';

        return (
          <Space size="small">
            <Button type="link" size="small" onClick={() => handleViewDetails(record.applicationCode)}>
              Xem
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => handleUpdateStatus(record.applicationCode, 'APPROVED')}
              disabled={!canModify}
            >
              Duyệt
            </Button>
            <Button
              type="primary"
              danger
              size="small"
              onClick={() => handleUpdateStatus(record.applicationCode, 'CANCEL')}
              disabled={!canModify}
            >
              Từ chối
            </Button>
          </Space>
        );
      }
    },
  ];

  return (
    <div className="admin-page-container">
      {/* --- SỬA LỖI: RENDER contextHolder --- */}
      {contextHolder}
      {/* ------------------------------------ */}

      <Title level={2}>Quản lý Hồ sơ tuyển sinh</Title>
      
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}><Input placeholder="Tìm theo mã hoặc tên..." prefix={<SearchOutlined />} allowClear onChange={(e) => handleFilterChange('search', e.target.value)} /></Col>
          <Col xs={24} sm={12} md={6}><Select placeholder="Lọc theo trường" style={{ width: '100%' }} allowClear onChange={(v) => handleFilterChange('schoolCode', v)} options={schools.map(s => ({label: s.name, value: s.code}))} showSearch optionFilterProp="label" /></Col>
          <Col xs={24} sm={12} md={5}><Select placeholder="Lọc theo ngành" style={{ width: '100%' }} allowClear disabled={!queryParams.schoolCode} onChange={(v) => handleFilterChange('majorCode', v)} options={majors.map(m => ({label: m.name, value: m.code}))} showSearch optionFilterProp="label"/></Col>
          <Col xs={24} sm={12} md={4}><Select placeholder="Lọc theo trạng thái" style={{ width: '100%' }} allowClear onChange={(v) => handleFilterChange('status', v)}><Option value="PENDING">Chờ duyệt</Option><Option value="APPROVED">Đã duyệt</Option><Option value="CANCEL">Từ chối</Option></Select></Col>
          <Col xs={24} sm={24} md={3}><DatePicker placeholder="Lọc theo ngày" style={{width: "100%"}} onChange={(date, dateString) => handleFilterChange('dateFrom', dateString as string)} /></Col>
        </Row>
      </Card>

      <Table columns={columns} dataSource={apiResponse?.applications || []} rowKey="applicationCode" loading={loading} pagination={false} bordered />
        
      <Row justify="end" style={{ marginTop: 24 }}><Col>{apiResponse && apiResponse.pagination.totalRecords > 0 && (<Pagination current={apiResponse.pagination.currentPage} pageSize={apiResponse.pagination.limit} total={apiResponse.pagination.totalRecords} onChange={(p, ps) => setQueryParams(prev => ({ ...prev, page: p, limit: ps || 10 }))} showSizeChanger pageSizeOptions={['10', '20', '50']} showTotal={(t, r) => `${r[0]}-${r[1]} trên ${t} hồ sơ`} />)}</Col></Row>

      <Modal title={<Title level={4}>Chi tiết hồ sơ: {selectedApplication?.applicationCode}</Title>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={[<Button key="back" onClick={() => setIsModalVisible(false)}>Đóng</Button>]} width={1000} destroyOnClose>
          {detailLoading ? <div style={{textAlign: 'center', padding: '50px 0'}}><Spin size="large"/></div> : selectedApplication && ( 
            <div>
              <Tag color={getStatusDetails(selectedApplication.status.code).color}>{selectedApplication.status.displayName.toUpperCase()}</Tag>
              <Divider />
              <Descriptions title="Thông tin chung" bordered column={2}>
                  <Descriptions.Item label="Họ và tên">{selectedApplication.fullname}</Descriptions.Item>
                  <Descriptions.Item label="Giới tính">{selectedApplication.gender}</Descriptions.Item>
                  <Descriptions.Item label="Ngày sinh">{selectedApplication.dob}</Descriptions.Item>
                  <Descriptions.Item label="Số CMND/CCCD">{selectedApplication.idNumber}</Descriptions.Item>
                  <Descriptions.Item label="Ngày nộp">
                    {selectedApplication.createdAt ? new Date(selectedApplication.createdAt).toLocaleString('vi-VN') : 'Không rõ'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Đối tượng ưu tiên">
                    {selectedApplication.priority || 'Không'}
                  </Descriptions.Item>
              </Descriptions>
              <Divider />
              <Descriptions title="Nguyện vọng & Điểm xét tuyển" bordered column={2}>
                  <Descriptions.Item label="Trường đăng ký">{selectedApplication.schoolName || selectedApplication.school}</Descriptions.Item>
                  <Descriptions.Item label="Ngành đăng ký">{selectedApplication.majorName || selectedApplication.major}</Descriptions.Item>
                  <Descriptions.Item label="Tổ hợp xét tuyển">{selectedApplication.subjectGroup}</Descriptions.Item>
                  <Descriptions.Item label="Tổng điểm">{selectedApplication.totalScore}</Descriptions.Item>
              </Descriptions>
              <Divider />
              <Title level={5}>Tài liệu đính kèm</Title>
              <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}><Card title="CCCD mặt trước"><Image width="100%" src={selectedApplication.cccdFront} /></Card></Col>
                  <Col xs={24} md={12}><Card title="CCCD mặt sau"><Image width="100%" src={selectedApplication.cccdBack} /></Card></Col>
              </Row>
              <Card title="Học bạ" style={{ marginTop: 16 }}>
                  <Image.PreviewGroup>
                    <Row gutter={[16, 16]}>
                      {selectedApplication.transcript.map((file: string, index: number) => (<Col key={index} xs={12} sm={8} md={6}><Image width="100%" src={file} /></Col>))}
                    </Row>
                  </Image.PreviewGroup>
              </Card>
              {selectedApplication.priorityProof && (
                <Card title="Minh chứng đối tượng ưu tiên" style={{ marginTop: 16 }}>
                    <Image width={200} src={selectedApplication.priorityProof} />
                </Card>
              )}
              {selectedApplication.extraDocuments && selectedApplication.extraDocuments.length > 0 && (
                <Card title="Tài liệu bổ sung" style={{ marginTop: 16 }}>
                  {selectedApplication.extraDocuments.map((doc: ExtraDocument, i: number) => (<div key={i}><Paragraph strong>{i + 1}. {doc.description}</Paragraph><Image.PreviewGroup><Row gutter={[16, 16]}>{doc.files.map((file: string, j: number) => (<Col key={j} xs={12} sm={8} md={6}><Image width="100%" src={file} /></Col>))}</Row></Image.PreviewGroup>{i < selectedApplication.extraDocuments.length - 1 && <Divider />}</div>))}
                </Card>
              )}
            </div>
           )}
      </Modal>
    </div>
  );
};

export default AdminApplicationsPage;
