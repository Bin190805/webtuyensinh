import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Typography, Pagination, Select, Row, Col, notification, Tooltip, Modal, Spin, Descriptions, Image, Divider, Card, Input, DatePicker } from 'antd';
import type { TableProps } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getUserApplicationsAPI, getApplicationDetailsAPI, PaginatedApplicationResponse, ApplicationDetail } from '../../services/resultService';
import '../../styles/ResultPage.css'; // Giả sử bạn có file CSS này
import type { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ApplicationDataType {
  key: string; // Sử dụng applicationCode làm key
  applicationCode: string;
  schoolName: string | null;
  majorName: string | null;
  status: string;
}

const ResultPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [apiResponse, setApiResponse] = useState<PaginatedApplicationResponse | null>(null);
  
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    search: undefined as string | undefined,
    status: undefined as string | undefined,
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
  });

  // useEffect để gọi API mỗi khi queryParams thay đổi, có debounce
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const params: any = { page: queryParams.page, limit: queryParams.limit };
      if (queryParams.search) params.search = queryParams.search;
      if (queryParams.status) params.status = queryParams.status;
      if (queryParams.dateFrom) params.dateFrom = queryParams.dateFrom;
      if (queryParams.dateTo) params.dateTo = queryParams.dateTo;
      
      try {
        const response = await getUserApplicationsAPI(params);
        setApiResponse(response);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách hồ sơ:", error);
        notification.error({ message: 'Lỗi', description: 'Không thể tải danh sách hồ sơ.' });
      } finally {
        setLoading(false);
      }
    };

    const handler = setTimeout(() => {
        fetchApplications();
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [queryParams]);

  const handleFilterChange = (key: string, value: any) => {
    setQueryParams(prev => ({ ...prev, page: 1, [key]: value || undefined }));
  };
  
  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setQueryParams(prev => ({
      ...prev,
      page: 1,
      dateFrom: dates?.[0]?.format('YYYY-MM-DD'),
      dateTo: dates?.[1]?.format('YYYY-MM-DD'),
    }));
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  // Giả định ApplicationDetail sẽ có thêm trường createdAt
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail & { createdAt?: string } | null>(null);

  const handleViewDetails = async (applicationCode: string) => {
    setIsModalVisible(true);
    setDetailLoading(true);
    try {
      const response = await getApplicationDetailsAPI(applicationCode);
      setSelectedApplication(response as ApplicationDetail & { createdAt?: string });
    } catch (error) {
      notification.error({ message: 'Lỗi', description: 'Không thể tải chi tiết hồ sơ.' });
      setIsModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };
  const handleCancelModal = () => { setIsModalVisible(false); setSelectedApplication(null); };

  const getStatusDetails = (status: string): { text: string; color: string } => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return { text: 'Chờ duyệt', color: 'blue' };
      case 'APPROVED': return { text: 'Đã duyệt', color: 'green' };
      case 'CANCEL': return { text: 'Từ chối', color: 'red' };
      default: return { text: status, color: 'default' };
    }
  };

  const columns: TableProps<ApplicationDataType>['columns'] = [
    { title: 'STT', key: 'index', render: (_, __, index) => (queryParams.page - 1) * queryParams.limit + index + 1, width: '5%', align: 'center' },
    { title: 'Mã hồ sơ', dataIndex: 'applicationCode', key: 'applicationCode' },
    { title: 'Trường đăng ký', dataIndex: 'schoolName', key: 'schoolName' },
    { title: 'Ngành đăng ký', dataIndex: 'majorName', key: 'majorName' },
    { title: 'Trạng thái', key: 'status', dataIndex: 'status', align: 'center', render: (status) => { const { text, color } = getStatusDetails(status); return <Tag color={color}>{text.toUpperCase()}</Tag>; } },
    { title: 'Hành động', key: 'action', align: 'center', render: (_, record) => { const { text } = getStatusDetails(record.status); const canModify = text.toUpperCase() === 'CHỜ DUYỆT'; return ( <Space size="small"> <Tooltip title="Xem chi tiết"><Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetails(record.applicationCode)} /></Tooltip> <Tooltip title="Sửa hồ sơ"><Button type="text" icon={<EditOutlined />} disabled={!canModify} /></Tooltip> <Tooltip title="Hủy hồ sơ"><Button type="text" icon={<DeleteOutlined />} danger disabled={!canModify} /></Tooltip> </Space> ); }, },
  ];

  const tableData: ApplicationDataType[] = apiResponse?.applications.map(app => ({ ...app, key: app.applicationCode })) || [];

  return (
    <div className="result-page-container">
      <div className="result-page-content">
        <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>Danh sách hồ sơ tuyển sinh</Title>
        
        {/* === PHẦN BỘ LỌC === */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm theo mã hồ sơ..."
                prefix={<SearchOutlined />}
                allowClear
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Lọc theo trạng thái"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => handleFilterChange('status', value)}
              >
                <Option value="PENDING">Chờ duyệt</Option>
                <Option value="APPROVED">Đã duyệt</Option>
                <Option value="CANCEL">Từ chối</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={handleDateChange}
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Col>
          </Row>
        </Card>

        <Table columns={columns} dataSource={tableData} loading={loading} pagination={false} bordered />
        
        <Row justify="space-between" align="middle" style={{ marginTop: 24 }}>
            <Col>
                <Space>
                    <Text>Hiển thị</Text>
                    <Select value={queryParams.limit} onChange={(value) => setQueryParams(prev => ({...prev, limit: value, page: 1}))} style={{ width: 100 }}>
                        <Option value={10}>10 hồ sơ</Option>
                        <Option value={20}>20 hồ sơ</Option>
                        <Option value={50}>50 hồ sơ</Option>
                    </Select>
                </Space>
            </Col>
            <Col>
                {apiResponse && apiResponse.pagination.totalRecords > 0 && (
                    <Pagination 
                        current={apiResponse.pagination.currentPage} 
                        pageSize={apiResponse.pagination.limit} 
                        total={apiResponse.pagination.totalRecords} 
                        onChange={(page, pageSize) => setQueryParams(prev => ({ ...prev, page, limit: pageSize }))} 
                        showSizeChanger={false}
                        showTotal={(total, range) => `${range[0]}-${range[1]} trên ${total} hồ sơ`} 
                    />
                )}
            </Col>
        </Row>
      </div>

      {/* Modal hiển thị chi tiết hồ sơ (giữ nguyên) */}
      <Modal title={<Title level={4}>Chi tiết hồ sơ: {selectedApplication?.applicationCode}</Title>} open={isModalVisible} onCancel={handleCancelModal} footer={[<Button key="back" onClick={handleCancelModal}>Đóng</Button>]} width={1000} destroyOnClose>
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" /></div>
          ) : selectedApplication && (
            <div>
              <Tag color={getStatusDetails(selectedApplication.status.code).color}>{selectedApplication.status.displayName.toUpperCase()}</Tag>
              <Divider />
              {/* Nội dung chi tiết */}
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
                      {selectedApplication.transcript.map((file, index) => (<Col key={index} xs={12} sm={8} md={6}><Image width="100%" src={file} /></Col>))}
                    </Row>
                  </Image.PreviewGroup>
              </Card>
              {/* === THÊM HIỂN THỊ MINH CHỨNG ƯU TIÊN === */}
              {selectedApplication.priorityProof && (
                <Card title="Minh chứng đối tượng ưu tiên" style={{ marginTop: 16 }}>
                    <Image width={200} src={selectedApplication.priorityProof} />
                </Card>
              )}
              {selectedApplication.extraDocuments && selectedApplication.extraDocuments.length > 0 && (
                <Card title="Tài liệu bổ sung" style={{ marginTop: 16 }}>
                  {selectedApplication.extraDocuments.map((doc, i) => (<div key={i}><Paragraph strong>{i + 1}. {doc.description}</Paragraph><Image.PreviewGroup><Row gutter={[16, 16]}>{doc.files.map((file, j) => (<Col key={j} xs={12} sm={8} md={6}><Image width="100%" src={file} /></Col>))}</Row></Image.PreviewGroup>{i < selectedApplication.extraDocuments.length - 1 && <Divider />}</div>))}
                </Card>
              )}
            </div>
          )}
      </Modal>
    </div>
  );
};

export default ResultPage;
