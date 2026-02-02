import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import { logService } from './services/logService';
import LogCharts from './components/LogCharts';
import LogTable from './components/LogTable';
import LogDetailModal from './components/LogDetailModal';

const { defaultAlgorithm, darkAlgorithm } = theme;

const App = () => {
    // --- STATE YÖNETİMİ ---
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ kaynakDagilimi: [], hataDagilimi: [] });
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchMode, setSearchMode] = useState('ClickHouse');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // --- API İŞLEMLERİ ---
    const loadStats = async () => {
        try {
            const data = await logService.getStats();
            setStats(data);
        } catch (error) {
            console.error("İstatistik hatası", error);
        }
    };

    const loadLogs = async (page = 1, size = 10, term = null) => {
        setLoading(true);
        try {
            const data = await logService.getLogs(page, size, term);
            setLogs(data.data);
            setPagination({ current: page, pageSize: size, total: data.totalCount });
            setSearchMode(term ? 'Elasticsearch (Arama)' : 'ClickHouse (Liste)');
        } catch (error) {
            message.error('Veri çekilemedi!');
        } finally {
            setLoading(false);
        }
    };

    // Log Detayı Getir
    const handleViewDetail = async (record) => {
        setIsModalVisible(true);
        setDetailLoading(true);
        setSelectedLog(null);
        try {
            const data = await logService.getLogById(record.id);
            setSelectedLog(data);
        } catch (error) {
            message.error("Detaylar alınamadı!");
        } finally {
            setDetailLoading(false);
        }
    };

    // --- EVENT HANDLERS ---
    useEffect(() => {
        loadLogs(1, 10, null);
        loadStats();
    }, []);

    const handleSearch = (value) => {
        setSearchTerm(value);
        loadLogs(1, 10, value);
    };

    const handleSliceClick = (name) => {
        message.success(`${name} kayıtları filtreleniyor...`);
        setSearchTerm(name);
        loadLogs(1, 10, name);
    };

    const handleTableChange = (newPagination) => {
        loadLogs(newPagination.current, newPagination.pageSize, searchTerm);
    };

    const handleReload = () => {
        loadLogs(pagination.current, pagination.pageSize, searchTerm);
        loadStats();
    };

    return (
        <ConfigProvider theme={{ algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm }}>
            <div style={{ padding: '30px', backgroundColor: isDarkMode ? '#141414' : '#f0f2f5', minHeight: '100vh' }}>

                <LogCharts
                    stats={stats}
                    isDarkMode={isDarkMode}
                    onSliceClick={handleSliceClick}
                />

                <LogTable
                    logs={logs}
                    loading={loading}
                    pagination={pagination}
                    searchMode={searchMode}
                    searchTerm={searchTerm}
                    isDarkMode={isDarkMode}
                    onTableChange={handleTableChange}
                    onSearch={handleSearch}
                    onInputChange={(e) => setSearchTerm(e.target.value)}
                    onReload={handleReload}
                    onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                    onViewDetail={handleViewDetail}
                />

                <LogDetailModal
                    visible={isModalVisible}
                    loading={detailLoading}
                    log={selectedLog}
                    isDarkMode={isDarkMode}
                    onClose={() => setIsModalVisible(false)}
                />
            </div>
        </ConfigProvider>
    );
};

export default App;