package com.quarkusproject;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import javax.sql.DataSource;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.Request;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Path("/api/logs")
public class LogResource {

    @Inject
    DataSource dataSource;

    @Inject
    RestClient restClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // --- CLICKHOUSE: LISTELEME VE SAYFALAMA ---
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public LogResponse getLogs(
            @QueryParam("kaynak") String kaynak,
            @QueryParam("search") String search,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("10") int size) {

        int offset = (page - 1) * size;
        List<LogData> logs = new ArrayList<>();
        long totalCount = 0;

        // İki sorgu hazırlıyoruz: Biri sayım için, biri veri için
        String countSql = "SELECT count() FROM log_data WHERE 1=1";
        StringBuilder dataSql = new StringBuilder("SELECT * FROM log_data WHERE 1=1");

        // (İleride filtre eklemek istersen buraya AND koşullarını ekleyebilirsin)

        dataSql.append(" ORDER BY zaman DESC LIMIT ? OFFSET ?");

        try (Connection conn = dataSource.getConnection()) {
            // 1. Toplam Kayıt Sayısını Al
            try (PreparedStatement psCount = conn.prepareStatement(countSql)) {
                ResultSet rsCount = psCount.executeQuery();
                if (rsCount.next()) totalCount = rsCount.getLong(1);
            }

            // 2. Sayfalanmış Veriyi Al
            try (PreparedStatement stmt = conn.prepareStatement(dataSql.toString())) {
                stmt.setInt(1, size);
                stmt.setInt(2, offset);

                ResultSet rs = stmt.executeQuery();
                while (rs.next()) {
                    logs.add(new LogData(
                            UUID.fromString(rs.getString("id")),
                            rs.getString("zaman"),
                            rs.getString("kaynak"),
                            rs.getString("sebep"),
                            rs.getString("mesaj"),
                            rs.getString("ip")
                    ));
                }
            }
        } catch (Exception e) { e.printStackTrace(); }

        return new LogResponse(logs, totalCount);
    }

    // --- ELASTICSEARCH: ARAMA VE DETAY ---
    @GET
    @Path("/search")
    @Produces(MediaType.APPLICATION_JSON)
    public LogResponse searchLogs(
            @QueryParam("term") String term,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("10") int size) throws IOException {

        int offset = (page - 1) * size;
        List<LogData> results = new ArrayList<>();

        // track_total_hits: true -> Gerçek toplam sayıyı almak için şarttır
        String query = String.format(
                "{\"from\": %d, \"size\": %d, \"track_total_hits\": true, \"query\": {\"multi_match\": {\"query\": \"%s\", \"fields\": [\"mesaj\", \"sebep\", \"kaynak\"]}}}",
                offset, size, term
        );

        Request request = new Request("POST", "/logs/_search");
        request.setJsonEntity(query);

        org.elasticsearch.client.Response response = restClient.performRequest(request);
        JsonNode rootNode = objectMapper.readTree(response.getEntity().getContent());

        // Toplam sayıyı çekiyoruz
        long totalHits = rootNode.path("hits").path("total").path("value").asLong();

        JsonNode hits = rootNode.path("hits").path("hits");
        for (JsonNode hit : hits) {
            JsonNode source = hit.path("_source");
            results.add(mapJsonToLog(source));
        }

        return new LogResponse(results, totalHits);
    }

    // --- ELASTICSEARCH: ID İLE TEKİL LOG GETİRME (Detay Modalı İçin) ---
    @GET
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public LogData getLogById(@PathParam("id") String id) throws IOException {
        System.out.println(">>> DETAY İSTEĞİ GELDİ! Elasticsearch ID: " + id + " aranıyor...");
        // ID keyword eşleşmesi yapıyoruz
        String query = String.format("{\"query\": {\"term\": {\"id.keyword\": \"%s\"}}}", id);

        Request request = new Request("POST", "/logs/_search");
        request.setJsonEntity(query);

        org.elasticsearch.client.Response response = restClient.performRequest(request);
        JsonNode rootNode = objectMapper.readTree(response.getEntity().getContent());
        JsonNode hit = rootNode.path("hits").path("hits").get(0);

        if (hit != null) {
            return mapJsonToLog(hit.path("_source"));
        }
        return null;
    }
    // ... Diğer metodların altına ekle ...

    @GET
    @Path("/stats")
    @Produces(MediaType.APPLICATION_JSON)
    public DashboardResponse getDashboardStats() {
        List<StatDTO> kaynakList = new ArrayList<>();
        List<StatDTO> hataList = new ArrayList<>();

        // 1. Kaynak Dağılımı (Tüm zamanlar)
        String sqlKaynak = "SELECT kaynak, count() as toplam FROM log_data GROUP BY kaynak";

        // 2. Hata Dağılımı (Sonraki aşamada zaman filtresi ekleyebiliriz)
        // Sadece hataları (SUCCESS olmayanları) getir
        String sqlHata = "SELECT sebep, count() as toplam FROM log_data WHERE sebep != 'SUCCESS' GROUP BY sebep";

        try (Connection conn = dataSource.getConnection()) {

            // Kaynakları Çek
            try (PreparedStatement ps = conn.prepareStatement(sqlKaynak);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    kaynakList.add(new StatDTO(rs.getString("kaynak"), rs.getLong("toplam")));
                }
            }

            // Hataları Çek
            try (PreparedStatement ps = conn.prepareStatement(sqlHata);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    hataList.add(new StatDTO(rs.getString("sebep"), rs.getLong("toplam")));
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return new DashboardResponse(kaynakList, hataList);
    }

    // --- YAZMA İŞLEMİ (DÜZELTİLDİ) ---
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addLog(LogData log) {
        // Hata Düzeltmesi: ID yoksa oluşturup nesneye geri set ediyoruz
        if (log.getId() == null) {
            log.setId(UUID.randomUUID());
        }

        String sql = "INSERT INTO log_data (id, zaman, kaynak, sebep, mesaj, ip) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, log.getId().toString());
            ps.setString(2, log.getZaman());
            ps.setString(3, log.getKaynak());
            ps.setString(4, log.getSebep());
            ps.setString(5, log.getMesaj());
            ps.setString(6, log.getIp());
            ps.executeUpdate();
            return Response.ok(log).build(); // Artık dönen JSON'da ID var!
        } catch (SQLException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }

    // JSON'dan Nesneye Dönüştürme Yardımcısı
    private LogData mapJsonToLog(JsonNode source) {
        return new LogData(
                UUID.fromString(source.path("id").asText()),
                source.path("zaman").asText(),
                source.path("kaynak").asText(),
                source.path("sebep").asText(),
                source.path("mesaj").asText(),
                source.path("ip").asText()
        );
    }
}