// src/pages/admin/AdmissionDataPage.tsx

import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Typography, notification, Modal, Form, Input, Select, Popconfirm, Card, Divider, Row, Col
} from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import {
    getAdmissionDataAPI,
    createSchoolAPI,
    updateSchoolAPI,
    deleteSchoolAPI,
    getAllSubjectCombinationsAPI,
    School
} from '../../services/admissionService';
import '../../styles/AdmissionDataPage.css';

const { Title } = Typography;
const { Option } = Select;

const AdmissionDataPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [schools, setSchools] = useState<School[]>([]);
    const [subjectCombinations, setSubjectCombinations] = useState<{ code: string; name: string }[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState("");

    const fetchData = async (search?: string) => {
        setLoading(true);
        try {
            const [schoolsData, combinationsData] = await Promise.all([
                getAdmissionDataAPI({ search }),
                getAllSubjectCombinationsAPI()
            ]);
            console.log(schoolsData);
            setSchools(schoolsData);
            setSubjectCombinations(combinationsData);
        } catch (error) {
            notification.error({ message: 'Lỗi', description: 'Không thể tải dữ liệu tuyển sinh.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = () => {
        fetchData(searchText);
    };

    const handleOpenModal = (school?: School) => {
        if (school) {
            const transformedMajors = school.majors.map((m) => ({
                code: m.code,
                name: m.name,
                subject_group_ids: m.subject_group_ids || [],
            }));
            school.majors.map((m) => console.log(m)
            );
            setEditingSchool(school);
            form.setFieldsValue({ ...school, majors: transformedMajors });
        } else {
            setEditingSchool(null);
            form.resetFields();
            form.setFieldsValue({
                majors: [{ code: '', name: '', subject_group_ids: [] }]
            });
        }
        setIsModalVisible(true);
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleFormSubmit = async (values: School) => {
        try {
            const payload = {
                code: values.code,
                name: values.name,
                majors: values.majors.map((major) => ({
                    code: major.code,
                    name: major.name,
                    subjectGroupIds: major.subject_group_ids
                }))
            };

            if (editingSchool) {
                await updateSchoolAPI(editingSchool.code, payload);
                notification.success({ message: 'Cập nhật trường thành công!' });
            } else {
                await createSchoolAPI(payload);
                notification.success({ message: 'Tạo trường mới thành công!' });
            }

            handleCancelModal();
            fetchData(searchText);
        } catch (error: any) {
            notification.error({
                message: 'Thất bại',
                description: error?.response?.data?.detail || 'Đã có lỗi xảy ra.'
            });
        }
    };

    const handleDeleteSchool = async (schoolCode: string) => {
        try {
            await deleteSchoolAPI(schoolCode);
            notification.success({ message: 'Xóa trường thành công!' });
            fetchData(searchText);
        } catch (error: any) {
            notification.error({ message: 'Xóa thất bại', description: error?.response?.data?.detail || 'Đã có lỗi xảy ra.' });
        }
    };

    const schoolColumns: TableProps<School>['columns'] = [
        { title: 'Mã trường', dataIndex: 'code', key: 'code', width: '15%' },
        { title: 'Tên trường', dataIndex: 'name', key: 'name', width: '55%' },
        {
            title: 'Số lượng ngành', key: 'majorsCount', align: 'center', width: '15%',
            render: (_, record: School) => record.majors.length
        },
        {
            title: 'Hành động', key: 'action', align: 'center', width: '15%',
            render: (_, record: School) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        console.log(record);
                        
                        handleOpenModal(record)}}>Sửa</Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa trường này?"
                        onConfirm={() => handleDeleteSchool(record.code)}
                    >
                        <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="admission-data-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>Quản lý Dữ liệu tuyển sinh</Title>
                <Space>
                    <Input
                        placeholder="Tìm theo mã hoặc tên trường"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onPressEnter={handleSearch}
                        allowClear
                        style={{ width: 280 }}
                        suffix={<SearchOutlined onClick={handleSearch} />}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
                        Thêm trường mới
                    </Button>
                </Space>
            </div>

            <Table
                columns={schoolColumns}
                dataSource={schools}
                loading={loading}
                rowKey="code"
                bordered
            />

            <Modal
                title={<Title level={4}>{editingSchool ? 'Cập nhật thông tin trường' : 'Thêm trường mới'}</Title>}
                open={isModalVisible}
                onCancel={handleCancelModal}
                footer={null}
                width={800}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                >
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="code"
                                label="Mã trường"
                                rules={[{ required: true, message: "Vui lòng nhập mã trường" }]}
                            >
                                <Input placeholder="Ví dụ: BKHN" disabled={!!editingSchool} />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item
                                name="name"
                                label="Tên trường"
                                rules={[{ required: true, message: "Vui lòng nhập tên trường" }]}
                            >
                                <Input placeholder="Ví dụ: Đại học Bách Khoa Hà Nội" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider>Danh sách ngành</Divider>

                    <Form.List
                        name="majors"
                        rules={[
                            {
                                validator: async (_, majors) => {
                                    if (!majors || majors.length < 1) {
                                        return Promise.reject(new Error('Phải có ít nhất 1 ngành'));
                                    }
                                    for (const major of majors) {
                                        if (!major.subject_group_ids || major.subject_group_ids.length === 0) {
                                            return Promise.reject(new Error('Mỗi ngành phải có ít nhất 1 tổ hợp môn'));
                                        }
                                    }
                                }
                            }
                        ]}
                    >
                        {(fields, { add, remove }, { errors }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card key={key} size="small" className="major-card">
                                        <Row gutter={16} align="middle">
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'code']}
                                                    label="Mã ngành"
                                                    rules={[{ required: true, message: 'Nhập mã ngành' }]}
                                                >
                                                    <Input placeholder="Ví dụ: CNTT" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={9}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'name']}
                                                    label="Tên ngành"
                                                    rules={[{ required: true, message: 'Nhập tên ngành' }]}
                                                >
                                                    <Input placeholder="Ví dụ: Công nghệ thông tin" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'subject_group_ids']}
                                                    label="Tổ hợp môn"
                                                    rules={[{ required: true, message: 'Chọn tổ hợp môn' }]}
                                                >
                                                    <Select mode="multiple" allowClear placeholder="Chọn tổ hợp môn">
                                                        {subjectCombinations.map(sc => (
                                                            <Option key={sc.code} value={sc.code}>
                                                                {`${sc.name} (${sc.code})`}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={1}>
                                                <DeleteOutlined
                                                    onClick={() => remove(name)}
                                                    style={{ color: 'red', marginTop: 30 }}
                                                />
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add({ code: '', name: '', subject_group_ids: [] })}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        Thêm ngành
                                    </Button>
                                    <Form.ErrorList errors={errors} />
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={handleCancelModal}>Hủy</Button>
                            <Button type="primary" htmlType="submit">
                                {editingSchool ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdmissionDataPage;
