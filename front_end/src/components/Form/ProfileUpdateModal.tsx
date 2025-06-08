import React, { useEffect } from "react";
import { Modal, Form, Input, DatePicker, Select, message } from "antd";
import dayjs from "dayjs";

const genderOptions = [
    { label: "Nam", value: "Nam" },
    { label: "Nữ", value: "Nữ" },
    { label: "Khác", value: "Khác" },
];

interface ProfileUpdateModalProps {
    visible: boolean;
    onClose: () => void;
    user: any;
    onSubmit: (data: any) => void;
}

const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({
    visible,
    onClose,
    user,
    onSubmit,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            form.setFieldsValue({
                ...user,
                birthday: user?.birthday ? dayjs(user.birthday) : null,
            });
        }
    }, [visible, user, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                birthday: values.birthday ? values.birthday.format("YYYY-MM-DD") : null,
            };
            onSubmit(payload);
        } catch (error) {
            message.error("Vui lòng nhập đầy đủ thông tin!");
        }
    };

    return (
        <Modal
            title="Cập nhật hồ sơ"
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            okText="Lưu"
            cancelText="Hủy"
            centered
        >
            <Form form={form} layout="vertical">
                <Form.Item name="full_name" label="Họ và tên">
                    <Input />
                </Form.Item>
                <Form.Item name="phone" label="Số điện thoại">
                    <Input />
                </Form.Item>
                <Form.Item name="gender" label="Giới tính">
                    <Select options={genderOptions} allowClear placeholder="Giới tính" />
                </Form.Item>
                <Form.Item name="address" label="Địa chỉ">
                    <Input />
                </Form.Item>
                <Form.Item name="birthday" label="Ngày sinh">
                    <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ProfileUpdateModal;
