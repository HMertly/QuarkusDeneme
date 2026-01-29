import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Space, Button, message, ConfigProvider, theme, Switch, Input } from 'antd';
import { ReloadOutlined, DesktopOutlined, WifiOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Search } = Input;
const { defaultAlgorithm, darkAlgorithm } = theme;

const App = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchMode, setSearchMode] = useState('ClickHouse');

    // YENİ: Sayfalama Durumu (State)
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 1000 // Not: Gerçek total count için ayrı bir sorgu gerekir, şimdilik statik veriyoruz.
    });
    const [searchTerm, setSearchTerm] = useState(null); // Arama terimini tutalım

    // Veri Çeken Ortak Fonksiyon (Hem Liste Hem Arama İçin)
    const fetchData = async (page = 1, pageSize = 10, term = null) => {
        setLoading(true);
        try {
            let url = '';
            // Arama var mı yok mu kontrolü
            if (term) {
                setSearchMode('Elasticsearch');
                url = `http://localhost:8080/api/logs/search?term=${term}&page=${page}&size=${pageSize}`;
            } else {
                setSearchMode('ClickHouse');
                url = `http://localhost:8080/api/logs?page=${page}&size=${pageSize}`;
            }

            const response = await axios.get(url);
            setLogs(response.data);

            // Sayfalama bilgisini güncelle
            setPagination({
                ...pagination,
                current: page,
                pageSize: pageSize
            });

        } catch (error) {
            message.error('Veri çekilemedi!');
        } finally {
            setLoading(false);
        }
    };

    // İlk açılışta veriyi çek
    useEffect(() => {
        fetchData(1, 10, null);
    }, []);

    // Tablo sayfa değişimi tetiklendiğinde çalışır
    const handleTableChange = (newPagination) => {
        fetchData(newPagination.current, newPagination.pageSize, searchTerm);
    };

    // Arama yapıldığında
    const onSearch = (value) => {
        setSearchTerm(value); // Arama terimini kaydet
        fetchData(1, 10, value); // 1. sayfadan aramayı başlat
    };

    // Yenile butonu
    const onReload = () => {
        fetchData(pagination.current, pagination.pageSize, searchTerm);
    };

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
        { title: 'Mesaj', dataIndex: 'mesaj', key: 'mesaj' },
        { title: 'IP Adresi', dataIndex: 'ip', key: 'ip' },
    ];

    return (
        <ConfigProvider theme={{ algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm }}>
            <div style={{ padding: '30px', backgroundColor: isDarkMode ? '#141414' : '#f0f2f5', minHeight: '100vh' }}>
                <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Space style={{ marginBottom: 20, justifyContent: 'space-between', width: '100%' }}>
                        <Space direction="vertical" size={0}>
                            <Title level={3} style={{ margin: 0 }}>Log İzleme Paneli</Title>
                            <Typography.Text type="secondary">
                                Kaynak: <Tag color="orange">{searchMode}</Tag>
                            </Typography.Text>
                        </Space>

                        <Space size="large">
                            <Search
                                placeholder="Elasticsearch ile ara..."
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
                                onClick={onReload}
                                loading={loading}
                            >
                                Yenile
                            </Button>
                        </Space>
                    </Space>

                    <Table
                        columns={columns}
                        dataSource={logs}
                        rowKey="id"
                        loading={loading}
                        // Pagination ayarları güncellendi
                        pagination={pagination}
                        onChange={handleTableChange} // Sayfa değişimini dinle
                        bordered
                        scroll={{ x: 800 }}
                    />
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default App;