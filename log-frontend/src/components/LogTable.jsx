import React from 'react';
import { Table, Tag, Button, Space, Typography, Card, Input, Switch } from 'antd';
import { DesktopOutlined, WifiOutlined, EyeOutlined, ReloadOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';
import { LOG_SOURCES, LOG_REASONS, SEARCH_MODES } from '../constants'; // Sabitler import edildi

const { Title } = Typography;
const { Search } = Input;

const LogTable = ({ logs, loading, pagination, searchMode, searchTerm, isDarkMode, onTableChange, onSearch, onInputChange, onReload, onToggleTheme, onViewDetail }) => {

    const columns = [
        { title: 'Zaman', dataIndex: 'zaman', key: 'zaman', width: 180 },
        {
            title: 'Kaynak',
            dataIndex: 'kaynak',
            key: 'kaynak',
            width: 120,
            render: (text) => (
                // "WEB" yerine LOG_SOURCES.WEB kullandık
                <Tag
                    color={text === LOG_SOURCES.WEB ? 'blue' : 'purple'}
                    icon={text === LOG_SOURCES.WEB ? <DesktopOutlined /> : <WifiOutlined />}
                >
                    {text}
                </Tag>
            ),
        },
        {
            title: 'Sebep',
            dataIndex: 'sebep',
            key: 'sebep',
            render: (text) => {
                // Magic String kontrolü yerine sabitler
                let color = 'red';
                if (text === LOG_REASONS.SUCCESS) color = 'green';
                else if (text === LOG_REASONS.TIMEOUT) color = 'volcano';

                return <Tag color={color}>{text}</Tag>;
            },
        },
        { title: 'Mesaj', dataIndex: 'mesaj', key: 'mesaj', ellipsis: true },
        {
            title: 'İşlem',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button type="primary" ghost size="small" icon={<EyeOutlined />} onClick={() => onViewDetail(record)}>Detay</Button>
            )
        },
    ];

    return (
        <Card variant="borderless" className="table-card">
            <Space style={{ marginBottom: 20, justifyContent: 'space-between', width: '100%' }}>
                <Space orientation="vertical" size={0}>
                    <Title level={3} style={{ margin: 0 }}>Log İzleme Paneli</Title>
                    <Typography.Text type="secondary">
                        Kaynak: <Tag color={searchMode.includes('Elastic') ? 'green' : 'blue'}>{searchMode}</Tag>
                    </Typography.Text>
                </Space>
                {/* ... Geri kalan butonlar aynı ... */}
                <Space size="large">
                    <Search placeholder="Ara..." allowClear enterButton="Ara" size="large" value={searchTerm} onChange={onInputChange} onSearch={onSearch} style={{ width: 350 }} />
                    <Switch checkedChildren={<BulbFilled />} unCheckedChildren={<BulbOutlined />} checked={isDarkMode} onChange={onToggleTheme} />
                    <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>Yenile</Button>
                </Space>
            </Space>

            <Table columns={columns} dataSource={logs} rowKey="id" loading={loading} pagination={pagination} onChange={onTableChange} bordered scroll={{ x: 800 }} />
        </Card>
    );
};

export default LogTable;