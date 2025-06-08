import React, { useState, useEffect } from 'react';
import { App, Form, Input, Button, Select, DatePicker, Upload, Typography, message, Space, Row, Col, notification } from 'antd';
import { PlusOutlined, UploadOutlined, MinusCircleOutlined } from '@ant-design/icons';

// Import các hàm API và tiện ích
import { fileToBase64 } from '../../utils/fileConverter'; // Đảm bảo đường dẫn đúng
import { submitApplicationAPI } from '../../services/applicationService'; // Đảm bảo đường dẫn đúng
import { getAllSchoolsAPI, getMajorsBySchoolAPI, getSubjectCombinationAPI } from '../../services/applicationService'; // Đảm bảo đường dẫn đúng
import vietnamAddress from '../../assets/file/vietnamAddress.json'; // Đảm bảo đường dẫn đúng

const { Title } = Typography;
const { Option } = Select;

const MAX_EXTRA_DOCUMENTS = 5;

// Các interface để code an toàn hơn (có thể đặt trong file riêng)
interface School {
  _id: string;
  name: string;
  code: string;
}

interface Major {
  code: string;
  name: string;
  subject_group_ids: string[];
}

interface Subject {
    code: string;
    name: string;
    display_name: string;
}

interface SubjectCombination {
  code: string;
  name: string;
  subjects: Subject[];
}

const AdmissionFormPage: React.FC = () => {
  const { message, notification } = App.useApp();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  // States cho địa chỉ
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>();

  // States cho việc xét tuyển
  const [universities, setUniversities] = useState<School[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjectGroupDetails, setSubjectGroupDetails] = useState<SubjectCombination[]>([]);
  const [selectedSubjectGroup, setSelectedSubjectGroup] = useState<SubjectCombination | undefined>();

  // Tải danh sách trường và tỉnh/thành khi component được render
  useEffect(() => {
    getAllSchoolsAPI()
      .then(setUniversities)
      .catch(err => {
        console.error("Lỗi khi tải danh sách trường:", err);
        message.error("Không thể tải danh sách trường.");
      });
      
    setProvinces(vietnamAddress);
  }, []);

  // ===== CÁC HÀM XỬ LÝ SỰ KIỆN =====

  const handleSchoolChange = async (schoolCode: string) => {
    form.setFieldsValue({ major: undefined, subjectGroup: undefined });
    setMajors([]);
    setSubjectGroupDetails([]);
    setTotalScore(null);
    setSelectedSubjectGroup(undefined);
    if (!schoolCode) return;
    try {
      const majorsData = await getMajorsBySchoolAPI(schoolCode);
      setMajors(majorsData);
    } catch (error) {
      console.error("Lỗi khi tải ngành học:", error);
      message.error("Không thể tải danh sách ngành học.");
    }
  };

  const handleMajorChange = async (majorCode: string) => {
    form.setFieldsValue({ subjectGroup: undefined });
    setSubjectGroupDetails([]);
    setTotalScore(null);
    setSelectedSubjectGroup(undefined);
    if (!majorCode) return;
    const selectedMajor = majors.find(m => m.code === majorCode);
    if (selectedMajor && selectedMajor.subject_group_ids) {
      try {
        const combinationPromises = selectedMajor.subject_group_ids.map(id => getSubjectCombinationAPI(id));
        const combinations = await Promise.all(combinationPromises);
        setSubjectGroupDetails(combinations);
      } catch (error) {
        console.error("Lỗi khi tải tổ hợp môn:", error);
        message.error("Không thể tải danh sách tổ hợp môn.");
      }
    }
  };

  const calculateTotalScore = (subjectGroup: SubjectCombination) => {
    const formScores = form.getFieldsValue();
    let total = 0;
    const fieldMap: { [key: string]: string } = {
      "MATH101": "mathScore", "LIT102": "literatureScore", "ENG103": "englishScore",
      "PHY104": "physicsScore", "CHE105": "chemistryScore", "BIO106": "biologyScore",
      "HIS107": "historyScore", "GEO108": "geographyScore", "CIV109": "civicEducationScore"
    };
    subjectGroup.subjects.forEach(subject => {
        const fieldName = fieldMap[subject.code];
        if (fieldName && formScores[fieldName]) {
            total += parseFloat(formScores[fieldName]) || 0;
        }
    });
    setTotalScore(total);
  };
  
  const handleSubjectGroupChange = (subjectGroupCode: string) => {
    const group = subjectGroupDetails.find(g => g.code === subjectGroupCode);
    setSelectedSubjectGroup(group);
    if (group) {
        calculateTotalScore(group);
    } else {
        setTotalScore(null);
    }
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    const selectedProvinceData = vietnamAddress.find((p: any) => p.Id === value);
    setDistricts(selectedProvinceData?.Districts || []);
    form.setFieldsValue({ district: undefined, ward: undefined, addressDetail: '' });
    setWards([]);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    const selectedDistrictData = districts.find((d: any) => d.Id === value);
    setWards(selectedDistrictData?.Wards || []);
    form.setFieldsValue({ ward: undefined });
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    message.loading({ content: 'Đang xử lý và gửi hồ sơ...', key: 'submitting' });

    try {
      // 1. Chuyển đổi file sang Base64
      const cccdFrontBase64 = await fileToBase64(values.cccdFront[0].originFileObj);
      const cccdBackBase64 = await fileToBase64(values.cccdBack[0].originFileObj);
      const transcriptBase64 = await Promise.all(values.transcript.map((file: any) => fileToBase64(file.originFileObj)));
      const priorityProofBase64 = values.priorityProof?.[0]?.originFileObj
        ? await fileToBase64(values.priorityProof[0].originFileObj)
        : undefined;

      let extraDocumentsPayload = [];
      if (values.extraDocuments?.length) {
          extraDocumentsPayload = await Promise.all(
              values.extraDocuments.map(async (doc: any) => {
                  const filesBase64 = doc.files?.length ? await Promise.all(doc.files.map((file: any) => fileToBase64(file.originFileObj))) : [];
                  return { description: doc.description || '', files: filesBase64 };
              })
          );
      }
      
      const payload = {
          ...values,
          dob: values.dob.format('DD/MM/YYYY'),
          totalScore: totalScore || 0,
          cccdFront: cccdFrontBase64,
          cccdBack: cccdBackBase64,
          transcript: transcriptBase64,
          priorityProof: priorityProofBase64,
          extraDocuments: extraDocumentsPayload
      };
      
      const response = await submitApplicationAPI(payload);
      
      // Hủy thông báo loading và hiển thị notification thành công
      message.destroy('submitting');
      notification.success({
        message: 'Nộp hồ sơ thành công!',
        description: response.message || 'Hồ sơ của bạn đã được gửi đi và đang chờ xét duyệt.',
        placement: 'topRight', // Vị trí hiển thị
      });

      form.resetFields();
      setTotalScore(null);

    } catch (error: any) {
      console.error('Lỗi khi nộp hồ sơ:', error);
      const errorMessage = error.response?.data?.detail || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      
      // Hủy thông báo loading và hiển thị notification thất bại
      message.destroy('submitting');
      notification.error({
          message: 'Nộp hồ sơ thất bại!',
          description: errorMessage,
          placement: 'topRight',
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  const normFile = (e: any) => Array.isArray(e) ? e : e && e.fileList;

  // ===== PHẦN GIAO DIỆN (JSX) =====
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '30px' }}>Nộp hồ sơ xét tuyển đại học</Title>
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        
        <Title level={4}>1. Thông tin cá nhân</Title>
        <Form.Item name="fullname" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}>
          <Input />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="gender" label="Giới tính" rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}>
              <Select placeholder="Chọn giới tính"><Option value="Nam">Nam</Option><Option value="Nữ">Nữ</Option><Option value="Khác">Khác</Option></Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dob" label="Ngày sinh" rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="idNumber" label="Số CMND/CCCD" rules={[{ required: true, message: 'Vui lòng nhập số CMND/CCCD' }]}>
          <Input />
        </Form.Item>
        
        <Title level={4}>2. Địa chỉ</Title>
        <Form.Item name="province" label="Tỉnh/Thành phố" rules={[{ required: true }]}>
          <Select showSearch placeholder="Chọn tỉnh/thành phố" optionFilterProp="children" onChange={handleProvinceChange}>{provinces.map((p) => (<Option key={p.Id} value={p.Id}>{p.Name}</Option>))}</Select>
        </Form.Item>
        <Form.Item name="district" label="Quận/Huyện" rules={[{ required: true }]}>
          <Select showSearch placeholder="Chọn quận/huyện" optionFilterProp="children" onChange={handleDistrictChange} disabled={!selectedProvince}>{districts.map((d) => (<Option key={d.Id} value={d.Id}>{d.Name}</Option>))}</Select>
        </Form.Item>
        <Form.Item name="ward" label="Xã/Phường" rules={[{ required: true }]}>
          <Select showSearch placeholder="Chọn xã/phường" optionFilterProp="children" disabled={!selectedDistrict}>{wards.map((w) => (<Option key={w.Id} value={w.Id}>{w.Name}</Option>))}</Select>
        </Form.Item>
        <Form.Item name="addressDetail" label="Số nhà, tên đường, thôn/xóm" rules={[{ required: true, message: 'Vui lòng nhập chi tiết địa chỉ' }]}>
          <Input placeholder="Ví dụ: Số 10, ngõ 20, đường Cầu Giấy" />
        </Form.Item>

        <Title level={4}>3. Điểm thi THPT</Title>
        <Form.Item name="mathScore" label="Điểm Toán" rules={[{ required: true }]}><Input type="number" min={0} max={10} step={0.01} /></Form.Item>
        <Form.Item name="literatureScore" label="Điểm Văn" rules={[{ required: true }]}><Input type="number" min={0} max={10} step={0.01} /></Form.Item>
        <Form.Item name="englishScore" label="Điểm Tiếng Anh" rules={[{ required: true }]}><Input type="number" min={0} max={10} step={0.01} /></Form.Item>
        <Form.Item name="physicsScore" label="Điểm Vật lý"><Input type="number" min={0} max={10} step={0.01} /></Form.Item>
        <Form.Item name="chemistryScore" label="Điểm Hóa học"><Input type="number" min={0} max={10} step={0.01} /></Form.Item>
        <Form.Item name="biologyScore" label="Điểm Sinh học"><Input type="number" min={0} max={10} step={0.01} /></Form.Item>
        <Form.Item name="historyScore" label="Điểm Lịch sử"><Input type="number" min={0} max={10} step={0.01} /></Form.Item>
        <Form.Item name="geographyScore" label="Điểm Địa lý"><Input type="number" min={0} max={10} step={0.01} /></Form.Item>
        <Form.Item name="civicEducationScore" label="Điểm Giáo dục công dân"><Input type="number" min={0} max={10} step={0.01} /></Form.Item>

        <Title level={4}>4. Trường & Ngành xét tuyển</Title>
        <Form.Item name="school" label="Trường đăng ký" rules={[{ required: true }]}>
          <Select showSearch placeholder="Chọn trường" optionFilterProp="children" onChange={handleSchoolChange} allowClear>{universities.map((u) => (<Option key={u.code} value={u.code}>{u.name} ({u.code})</Option>))}</Select>
        </Form.Item>
        <Form.Item name="major" label="Ngành đăng ký" rules={[{ required: true }]}>
          <Select showSearch placeholder="Chọn ngành" optionFilterProp="children" onChange={handleMajorChange} disabled={majors.length === 0} allowClear>{majors.map((m) => (<Option key={m.code} value={m.code}>{m.name}</Option>))}</Select>
        </Form.Item>
        <Form.Item name="subjectGroup" label="Tổ hợp xét tuyển" rules={[{ required: true }]}>
          <Select placeholder="Chọn tổ hợp xét tuyển" onChange={handleSubjectGroupChange} disabled={subjectGroupDetails.length === 0} allowClear>{subjectGroupDetails.map((g) => (<Option key={g.code} value={g.code}>{g.name} ({g.code})</Option>))}</Select>
        </Form.Item>
        
        {selectedSubjectGroup && totalScore !== null && (
          <div style={{ fontSize: '18px', fontStyle: 'italic', color: 'green', marginBottom: '20px' }}><strong>Tổng điểm tổ hợp {selectedSubjectGroup.code}: </strong>{totalScore.toFixed(2)}</div>
        )}

        <Title level={4}>5. Tài liệu bắt buộc</Title>
        <Row gutter={16}>
          <Col span={12}><Form.Item name="cccdFront" label="Ảnh CCCD mặt trước" rules={[{ required: true }]} valuePropName="fileList" getValueFromEvent={normFile}><Upload maxCount={1} beforeUpload={() => false} listType="picture"><Button icon={<UploadOutlined />}>Chọn ảnh</Button></Upload></Form.Item></Col>
          <Col span={12}><Form.Item name="cccdBack" label="Ảnh CCCD mặt sau" rules={[{ required: true }]} valuePropName="fileList" getValueFromEvent={normFile}><Upload maxCount={1} beforeUpload={() => false} listType="picture"><Button icon={<UploadOutlined />}>Chọn ảnh</Button></Upload></Form.Item></Col>
        </Row>
        <Form.Item name="transcript" label="Ảnh học bạ (nhiều ảnh)" rules={[{ required: true }]} valuePropName="fileList" getValueFromEvent={normFile}><Upload multiple beforeUpload={() => false} listType="picture"><Button icon={<UploadOutlined />}>Tải lên học bạ</Button></Upload></Form.Item>

        <Title level={4}>6. Đối tượng ưu tiên (nếu có)</Title>
        <Form.Item name="priority" label="Đối tượng ưu tiên"><Select allowClear placeholder="Chọn đối tượng"><Option value="01">01 - Con liệt sĩ</Option><Option value="02">02 - Con thương binh</Option></Select></Form.Item>
        <Form.Item name="priorityProof" label="Minh chứng đối tượng ưu tiên" valuePropName="fileList" getValueFromEvent={normFile}><Upload maxCount={1} beforeUpload={() => false} listType="picture"><Button icon={<UploadOutlined />}>Tải lên minh chứng</Button></Upload></Form.Item>

        <Title level={4}>7. Tài liệu bổ sung (nếu có)</Title>
        <Form.List name="extraDocuments">
            {(fields, { add, remove }) => (<>
                {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8, border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px' }} align="baseline">
                    <Form.Item {...restField} name={[name, 'description']} label={`Mô tả ${name + 1}`} rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]} style={{ width: '300px' }}><Input placeholder="Ví dụ: Chứng chỉ IELTS 7.5" /></Form.Item>
                    <Form.Item {...restField} name={[name, 'files']} label={`Tải lên tệp ${name + 1}`} rules={[{ required: true, message: 'Vui lòng tải tệp' }]} valuePropName="fileList" getValueFromEvent={normFile}><Upload multiple beforeUpload={() => false} listType="picture"><Button icon={<UploadOutlined />}>Chọn tệp</Button></Upload></Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
                ))}
                {fields.length < MAX_EXTRA_DOCUMENTS && (<Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm tài liệu</Button></Form.Item>)}
            </>)}
        </Form.List>

        <Form.Item style={{ marginTop: 30, textAlign: 'center' }}>
          <Button type="primary" htmlType="submit" size="large" loading={isSubmitting}>
            {isSubmitting ? 'Đang nộp hồ sơ...' : 'Nộp hồ sơ'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AdmissionFormPage;