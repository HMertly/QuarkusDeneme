import React from 'react';
import { Card, Row, Col, Space } from 'antd';
import { PieChartOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';

const LogCharts = ({ stats, isDarkMode, onSliceClick }) => {

    // Tema ayarları
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
                itemName: { style: { fill: textColor, fontSize: 14 } }
            }
        },
        label: {
            text: 'value',
            position: 'outside',
            style: { fill: textColor, fontSize: 14, fontWeight: 'bold' },
            connector: true,
            transform: [{ type: 'overlapDodgeY' }],
        },
        // Tıklama Olayı (Buradan üst bileşene haber vereceğiz)
        onReady: (plot) => {
            plot.on('click', (event) => {
                const data = event?.data?.data;
                if (data?.name) {
                    onSliceClick(data.name);
                }
            });
        },
        interaction: { tooltip: true, elementHighlight: true },
        state: { active: { style: { cursor: 'pointer', lineWidth: 0 } } },
        theme: isDarkMode ? 'classicDark' : 'classic',
    };

    return (
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
    );
};

export default LogCharts;