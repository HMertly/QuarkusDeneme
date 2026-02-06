import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import { logService } from './services/logService';
import LogCharts from './components/LogCharts';
import LogTable from './components/LogTable';
import LogDetailModal from './components/LogDetailModal';
import { UI_COLORS, SEARCH_MODES } from './constants';
import './App.css';

const { defaultAlgorithm, darkAlgorithm } = theme;

const App = () => {
    // --- STATE YÖNETİMİ ---
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ kaynakDagilimi: [], hataDagilimi: [] });
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchMode, setSearchMode] = useState(SEARCH_MODES.CLICKHOUSE);
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
            // Constants dosyasından gelen sabitleri kullanıyoruz
            setSearchMode(term ? SEARCH_MODES.ELASTIC : SEARCH_MODES.CLICKHOUSE);
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

    // Toast mesajının üst üste binmesini engelleyen yeni fonksiyon
    const handleSliceClick = (name) => {
        message.open({
            type: 'success',
            content: `${name} kayıtları filtreleniyor...`,
            key: 'filter_toast', // Bu key sayesinde mesajlar birikmez
            duration: 2,
        });

        setSearchTerm(name);
        loadLogs(1, 10, name);
    };

    // EKSİK OLAN FONKSİYONLAR BURADA:
    const handleTableChange = (newPagination) => {
        loadLogs(newPagination.current, newPagination.pageSize, searchTerm);
    };

    const handleReload = () => {
        loadLogs(pagination.current, pagination.pageSize, searchTerm);
        loadStats();
    };

    return (
        <ConfigProvider theme={{ algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm }}>
            <div
                className="app-container"
                style={{ backgroundColor: isDarkMode ? UI_COLORS.DARK_BG : UI_COLORS.LIGHT_BG }}
            >

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