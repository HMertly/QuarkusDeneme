package com.quarkusproject;

import java.util.UUID;

public class LogData {
    private UUID id;
    private String zaman;
    private String kaynak;
    private String sebep;
    private String mesaj;
    private String ip;

    // Boş Constructor (Jackson JSON dönüşümü için şarttır)
    public LogData() {
    }

    // Dolu Constructor (Veritabanından okurken kullanılır)
    public LogData(UUID id, String zaman, String kaynak, String sebep, String mesaj, String ip) {
        this.id = id;
        this.zaman = zaman;
        this.kaynak = kaynak;
        this.sebep = sebep;
        this.mesaj = mesaj;
        this.ip = ip;
    }

    // --- GETTER VE SETTER METOTLARI (Hatanın çözümü burası) ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getZaman() { return zaman; }
    public void setZaman(String zaman) { this.zaman = zaman; }

    public String getKaynak() { return kaynak; }
    public void setKaynak(String kaynak) { this.kaynak = kaynak; }

    public String getSebep() { return sebep; }
    public void setSebep(String sebep) { this.sebep = sebep; }

    public String getMesaj() { return mesaj; }
    public void setMesaj(String mesaj) { this.mesaj = mesaj; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
}