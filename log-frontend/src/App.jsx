import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Space, Button, message, ConfigProvider, theme, Switch, Input, Modal, Descriptions, Spin, Row, Col } from 'antd';
import { ReloadOutlined, DesktopOutlined, WifiOutlined, BulbOutlined, BulbFilled, EyeOutlined, PieChartOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import axios from 'axios';

const { Title } = Typography;
const { Search } = Input;
const { defaultAlgorithm, darkAlgorithm } = theme;

const App = () => {
    // --- STATE TANIMLARI ---
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ kaynakDagilimi: [], hataDagilimi: [] });
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchMode, setSearchMode] = useState('ClickHouse');

    // Modal Durumları
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // Sayfalama
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const [searchTerm, setSearchTerm] = useState("");

    // --- VERİ ÇEKME FONKSİYONLARI ---
    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/logs/stats');
            setStats(response.data);
        } catch (error) {
            console.error("İstatistik alınamadı");
        }
    };

    const fetchData = async (page = 1, pageSize = 10, term = null) => {
        setLoading(true);
        try {
            const queryTerm = term && term.trim() !== "" ? term : null;

            const url = queryTerm
                ? `http://localhost:8080/api/logs/search?term=${queryTerm}&page=${page}&size=${pageSize}`
                : `http://localhost:8080/api/logs?page=${page}&size=${pageSize}`;

            setSearchMode(queryTerm ? 'Elasticsearch (Arama)' : 'ClickHouse (Liste)');

            const response = await axios.get(url);
            setLogs(response.data.data);
            setPagination({
                current: page,
                pageSize: pageSize,
                total: response.data.totalCount
            });

        } catch (error) {
            message.error('Veri çekilemedi!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1, 10, null);
        fetchStats();
    }, []);

    const handleTableChange = (newPagination) => {
        fetchData(newPagination.current, newPagination.pageSize, searchTerm);
    };

    const onSearch = (value) => {
        setSearchTerm(value);
        fetchData(1, 10, value);
    };

    const onInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const onReload = () => {
        fetchData(pagination.current, pagination.pageSize, searchTerm);
        fetchStats();
    };

    const showDetail = async (record) => {
        setIsModalVisible(true);
        setDetailLoading(true);
        setSelectedLog(null);
        try {
            const response = await axios.get(`http://localhost:8080/api/logs/${record.id}`);
            setSelectedLog(response.data);
        } catch (error) {
            message.error("Detaylar alınamadı!");
        } finally {
            setDetailLoading(false);
        }
    };

    // --- GRAFİK AYARLARI (SAFE MODE) ---
    const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';

    const commonConfig = {
        angleField: 'value',
        colorField: 'name',
        radius: 0.8,

        legend: {
            color: {
                title: false,
                position: 'top',
                rowPadding: 5,
                itemName: {
                    style: { fill: textColor, fontSize: 14 }
                }
            }
        },

        label: {
            text: 'value',
            position: 'outside',
            style: {
                fill: textColor,
                fontSize: 14,
                fontWeight: 'bold',
            },
            connector: true,
            transform: [{ type: 'overlapDodgeY' }],
        },

        // --- GARANTİ TIKLAMA YÖNTEMİ ---
        // Hata veren 'interaction' ve 'state' konfigürasyonlarını kaldırdık.
        // Sadece 'onReady' ile en ilkel 'click' olayını dinliyoruz.
        onReady: (plot) => {
            // 'click' olayı grafiğin neresine tıklanırsa tıklansın tetiklenir.
            plot.on('click', (event) => {
                // Tıklanan yerdeki veriyi yakalamaya çalışıyoruz
                // G2 5.0'da veri genellikle event.data.data içindedir.
                const clickedData = event?.data?.data;

                // Konsola yazdıralım ki çalıştığını görelim (F12 Console)
                console.log("TIKLAMA ALGILANDI:", event);
                console.log("YAKALANAN VERİ:", clickedData);

                if (clickedData && clickedData.name) {
                    message.success(`${clickedData.name} kayıtları getiriliyor...`);
                    // Hem input'u doldur hem aramayı yap
                    setSearchTerm(clickedData.name);
                    fetchData(1, 10, clickedData.name);
                }
            });
        },

        // Tema ayarı
        theme: isDarkMode ? 'classicDark' : 'classic',
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
        { title: 'Mesaj', dataIndex: 'mesaj', key: 'mesaj', ellipsis: true },
        {
            title: 'İşlem',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button type="primary" ghost size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>Detay</Button>
            )
        },
    ];

    return (
        <ConfigProvider theme={{ algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm }}>
            <div style={{ padding: '30px', backgroundColor: isDarkMode ? '#141414' : '#f0f2f5', minHeight: '100vh' }}>

                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={12}>
                        <Card title={<Space><PieChartOutlined /> Kaynak Dağılımı</Space>} variant="borderless">
                            {stats.kaynakDagilimi.length > 0 ? (
                                <Pie
                                    {...commonConfig}
                                    data={stats.kaynakDagilimi}
                                    height={250}
                                    key={isDarkMode ? 'source-dark' : 'source-light'}
                                />
                            ) : <div style={{height: 250, textAlign: 'center', paddingTop: 100, color: textColor}}>Veri Yok</div>}
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title={<Space><PieChartOutlined /> Hata Dağılımı (Success Hariç)</Space>} variant="borderless">
                            {stats.hataDagilimi.length > 0 ? (
                                <Pie
                                    {...commonConfig}
                                    data={stats.hataDagilimi}
                                    height={250}
                                    key={isDarkMode ? 'error-dark' : 'error-light'}
                                />
                            ) : <div style={{height: 250, textAlign: 'center', paddingTop: 100, color: textColor}}>Veri Yok</div>}
                        </Card>
                    </Col>
                </Row>

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
                            <Switch checkedChildren={<BulbFilled />} unCheckedChildren={<BulbOutlined />} checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
                            <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>Yenile</Button>
                        </Space>
                    </Space>

                    <Table columns={columns} dataSource={logs} rowKey="id" loading={loading} pagination={pagination} onChange={handleTableChange} bordered scroll={{ x: 800 }} />
                </Card>

                <Modal title="Log Detayı" open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={[<Button key="close" onClick={() => setIsModalVisible(false)}>Kapat</Button>]} width={700}>
                    {detailLoading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
                    ) : (selectedLog && (
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Log ID">{selectedLog.id}</Descriptions.Item>
                            <Descriptions.Item label="Zaman">{selectedLog.zaman}</Descriptions.Item>
                            <Descriptions.Item label="Kaynak"><Tag color="blue">{selectedLog.kaynak}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Sebep"><Tag color={selectedLog.sebep === 'SUCCESS' ? 'green' : 'red'}>{selectedLog.sebep}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Mesaj">
                                <div style={{ padding: 15, background: isDarkMode ? '#333' : '#f5f5f5', borderRadius: 4, fontFamily: 'monospace' }}>{selectedLog.mesaj}</div>
                            </Descriptions.Item>
                        </Descriptions>
                    ))}
                </Modal>
            </div>
        </ConfigProvider>
    );
};

export default App;