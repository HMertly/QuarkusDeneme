import React from 'react';
import { Table, Tag, Button, Space, Typography, Card, Input, Switch } from 'antd';
import { DesktopOutlined, WifiOutlined, EyeOutlined, ReloadOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

const LogTable = ({
                      logs,
                      loading,
                      pagination,
                      searchMode,
                      searchTerm,
                      isDarkMode,
                      onTableChange,
                      onSearch,
                      onInputChange,
                      onReload,
                      onToggleTheme,
                      onViewDetail
                  }) => {

    const columns = [
        { title: 'Zaman', dataIndex: 'zaman', key: 'zaman', width: 180 },
        {
            title: 'Kaynak',
            dataIndex: 'kaynak',
            key: 'kaynak',
            width: 120,
            render: (text) => (
                <Tag color={text === 'WEB' ? 'blue' : 'purple'} icon={text === 'WEB' ? <DesktopOutlined /> : <WifiOutlined />}>
                    {text}
                </Tag>
            ),
        },
        {
            title: 'Sebep',
            dataIndex: 'sebep',
            key: 'sebep',
            render: (text) => {
                let color = text === 'SUCCESS' ? 'green' : text === 'TIMEOUT' ? 'volcano' : 'red';
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
        <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Space style={{ marginBottom: 20, justifyContent: 'space-between', width: '100%' }}>
                <Space orientation="vertical" size={0}>
                    <Title level={3} style={{ margin: 0 }}>Log İzleme Paneli</Title>
                    <Typography.Text type="secondary">
                        Kaynak: <Tag color={searchMode.includes('Elastic') ? 'green' : 'blue'}>{searchMode}</Tag>
                    </Typography.Text>
                </Space>

                <Space size="large">
                    <Search
                        placeholder="Ara..."
                        allowClear
                        enterButton="Ara"
                        size="large"
                        value={searchTerm}
                        onChange={onInputChange}
                        onSearch={onSearch}
                        style={{ width: 350 }}
                    />
                    <Switch
                        checkedChildren={<BulbFilled />}
                        unCheckedChildren={<BulbOutlined />}
                        checked={isDarkMode}
                        onChange={onToggleTheme}
                    />
                    <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>Yenile</Button>
                </Space>
            </Space>

            <Table
                columns={columns}
                dataSource={logs}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={onTableChange}
                bordered
                scroll={{ x: 800 }}
            />
        </Card>
    );
};

export default LogTable;