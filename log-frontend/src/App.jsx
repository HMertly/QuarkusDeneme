import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Space, Button, message, ConfigProvider, theme, Switch, Input } from 'antd';
import { ReloadOutlined, DesktopOutlined, WifiOutlined, BulbOutlined, BulbFilled, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Search } = Input;
const { defaultAlgorithm, darkAlgorithm } = theme;

const App = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchMode, setSearchMode] = useState('ClickHouse');

    // ClickHouse'dan veri çeken ana fonksiyon
    const fetchLogs = async () => {
        setLoading(true);
        setSearchMode('ClickHouse');
        try {
            const response = await axios.get('http://localhost:8080/api/logs');
            setLogs(response.data);
            message.info('ClickHouse verileri listelendi.');
        } catch (error) {
            message.error('Veri çekilemedi!');
        } finally {
            setLoading(false);
        }
    };

    // Elasticsearch üzerinden arama yapan fonksiyon
    const onSearch = async (value) => {
        if (!value) {
            fetchLogs();
            return;
        }
        setLoading(true);
        setSearchMode('Elasticsearch');
        try {
            const response = await axios.get(`http://localhost:8080/api/logs/search?term=${value}`);
            setLogs(response.data);
            message.success(`${response.data.length} sonuç Elasticsearch ile saniyeler içinde bulundu!`);
        } catch (error) {
            message.error('Elasticsearch araması başarısız!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            title: 'Zaman',
            dataIndex: 'zaman',
            key: 'zaman',
            width: 180,
            sorter: (a, b) => new Date(a.zaman) - new Date(b.zaman),
        },
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
        {
            title: 'Mesaj',
            dataIndex: 'mesaj',
            key: 'mesaj',
        },
        {
            title: 'IP Adresi',
            dataIndex: 'ip',
            key: 'ip',
        },
    ];

    return (
        <ConfigProvider theme={{ algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm }}>
            <div style={{
                padding: '30px',
                backgroundColor: isDarkMode ? '#141414' : '#f0f2f5',
                minHeight: '100vh',
                transition: 'all 0.3s'
            }}>
                <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Space style={{ marginBottom: 20, justifyContent: 'space-between', width: '100%' }}>
                        <Space direction="vertical" size={0}>
                            <Title level={3} style={{ margin: 0 }}>Log İzleme Paneli</Title>
                            <Typography.Text type="secondary">
                                Şu anki veri kaynağı: <Tag color="orange">{searchMode}</Tag>
                            </Typography.Text>
                        </Space>

                        <Space size="large">
                            <Search
                                placeholder="Elasticsearch ile hızlı ara..."
                                allowClear
                                enterButton="Ara"
                                size="large"
                                onSearch={onSearch}
                                style={{ width: 350 }}
                            />
                            <Switch
                                checkedChildren={<BulbFilled />}
                                unCheckedChildren={<BulbOutlined />}
                                checked={isDarkMode}
                                onChange={() => setIsDarkMode(!isDarkMode)}
                            />
                            <Button
                                type="default"
                                icon={<ReloadOutlined />}
                                onClick={fetchLogs}
                                loading={loading}
                            >
                                Listeyi Yenile
                            </Button>
                        </Space>
                    </Space>

                    <Table
                        columns={columns}
                        dataSource={logs}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        bordered
                        scroll={{ x: 800 }}
                    />
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default App;