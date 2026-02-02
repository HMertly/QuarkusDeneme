import React from 'react';
import { Modal, Button, Descriptions, Tag, Spin } from 'antd';

const LogDetailModal = ({ visible, loading, log, onClose, isDarkMode }) => {
    return (
        <Modal
            title="Log Detayı"
            open={visible}
            onCancel={onClose}
            footer={[<Button key="close" onClick={onClose}>Kapat</Button>]}
            width={700}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
            ) : (log && (
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Log ID">{log.id}</Descriptions.Item>
                    <Descriptions.Item label="Zaman">{log.zaman}</Descriptions.Item>
                    <Descriptions.Item label="Kaynak"><Tag color="blue">{log.kaynak}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Sebep">
                        <Tag color={log.sebep === 'SUCCESS' ? 'green' : 'red'}>{log.sebep}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mesaj">
                        <div style={{
                            padding: 15,
                            background: isDarkMode ? '#333' : '#f5f5f5',
                            borderRadius: 4,
                            fontFamily: 'monospace'
                        }}>
                            {log.mesaj}
                        </div>
                    </Descriptions.Item>
                </Descriptions>
            ))}
        </Modal>
    );
};

export default LogDetailModal;