import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Row, Col, Statistic, Spin, notification, DatePicker, Select } from 'antd';
import { SolutionOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { getOverviewStatisticsAPI, OverviewStatisticsResponse } from '../../services/adminDashboardService'; // Đảm bảo đường dẫn đúng
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mảng màu cho biểu đồ
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#19A2FF', '#FFC300', '#DAF7A6', '#C70039'];

// Hàm helper để lấy thông tin chi tiết của trạng thái
const getStatusDetails = (statusId: string) => {
    switch (statusId) {
      case 'APPROVED': return { name: 'Đã duyệt', color: '#87d068' };
      case 'PENDING': return { name: 'Chờ duyệt', color: '#108ee9' };
      case 'CANCEL': return { name: 'Từ chối', color: '#f50' };
      default: return { name: statusId, color: '#bebebe' };
    }
};

const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<OverviewStatisticsResponse | null>(null);
  // State để điều khiển loại dữ liệu cho biểu đồ tròn mới
  const [dynamicPieSource, setDynamicPieSource] = useState<'school' | 'major' | 'subjectGroup'>('school');

  const fetchStats = async (dates?: [Dayjs | null, Dayjs | null]) => {
    setLoading(true);
    try {
      const dateFrom = dates?.[0]?.format('YYYY-MM-DD');
      const dateTo = dates?.[1]?.format('YYYY-MM-DD');
      const data = await getOverviewStatisticsAPI(dateFrom, dateTo);
      setStatsData(data);
    } catch (error) {
      notification.error({ message: 'Lỗi', description: 'Không thể tải dữ liệu thống kê.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    fetchStats(dates || undefined);
  };

  // Chuẩn bị dữ liệu cho các biểu đồ
  const statusChartData = useMemo(() => 
    statsData?.byStatus.map(item => ({
      name: getStatusDetails(item._id).name,
      value: item.count,
      color: getStatusDetails(item._id).color,
  })) || [], [statsData]);

  // Dữ liệu cho biểu đồ tròn động
  const dynamicPieChartData = useMemo(() => {
    if (!statsData) return [];
    // Sửa lỗi: Thêm kiểu dữ liệu tường minh cho sourceData
    let sourceData: { name: string; value: number }[] = [];
    switch (dynamicPieSource) {
      case 'school':
        sourceData = statsData.bySchool.map(item => ({ name: item.name, value: item.count }));
        break;
      case 'major':
        sourceData = statsData.byMajor.map(item => ({ name: item._id, value: item.count }));
        break;
      case 'subjectGroup':
        sourceData = statsData.bySubjectGroup.map(item => ({ name: item._id, value: item.count }));
        break;
      default:
        sourceData = [];
    }
    return sourceData.slice(0, 10); // Chỉ lấy top 10 cho dễ nhìn
  }, [statsData, dynamicPieSource]);

  const dynamicPieChartTitle = useMemo(() => {
    switch (dynamicPieSource) {
      case 'school': return "Top 10 Trường";
      case 'major': return "Top 10 Ngành";
      case 'subjectGroup': return "Tổ hợp môn";
    }
  }, [dynamicPieSource]);


  // Tính toán các số liệu thống kê
  const approvedCount = statsData?.byStatus.find(s => s._id === 'APPROVED')?.count || 0;
  const pendingCount = statsData?.byStatus.find(s => s._id === 'PENDING')?.count || 0;
  const rejectedCount = statsData?.byStatus.find(s => s._id === 'CANCEL')?.count || 0;

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>Tổng quan hệ thống</Title>
        </Col>
        <Col>
          <RangePicker onChange={handleDateChange} />
        </Col>
      </Row>
      
      <Row gutter={[24, 24]}>
        {/* Các thẻ thống kê */}
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Tổng số hồ sơ" value={statsData?.totalApplications} prefix={<SolutionOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Đã duyệt" value={approvedCount} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Chờ duyệt" value={pendingCount} valueStyle={{ color: '#108ee9' }} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Đã từ chối" value={rejectedCount} valueStyle={{ color: '#cf1322' }} prefix={<CloseCircleOutlined />} /></Card>
        </Col>
        
        {/* Biểu đồ trạng thái hồ sơ */}
        <Col xs={24} lg={8}>
          <Card title="Phân loại theo trạng thái">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* --- BIỂU ĐỒ TRÒN ĐỘNG (MỚI) --- */}
        <Col xs={24} lg={16}>
          <Card 
            title="Thống kê hồ sơ"
            extra={
              <Select value={dynamicPieSource} onChange={value => setDynamicPieSource(value)} style={{ width: 150 }}>
                <Option value="school">Theo Trường</Option>
                <Option value="major">Theo Ngành</Option>
                <Option value="subjectGroup">Theo Tổ hợp</Option>
              </Select>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dynamicPieChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name={dynamicPieChartTitle} fill="#8884d8">
                  {dynamicPieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboardPage;
