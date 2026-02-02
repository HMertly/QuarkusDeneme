package com.quarkusproject.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.quarkusproject.dto.LogData;
import com.quarkusproject.dto.StatDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.elasticsearch.client.RestClient;
import org.jboss.logging.Logger; // Quarkus Logger

import javax.sql.DataSource;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class LogRepository {

    // PROFESYONEL LOGGING (Madde E Çözümü)
    private static final Logger LOG = Logger.getLogger(LogRepository.class);

    @Inject
    DataSource dataSource;

    @Inject
    RestClient restClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // --- CLICKHOUSE İŞLEMLERİ ---

    public long getTotalCount() {
        String sql = "SELECT count() FROM log_data";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getLong(1);
        } catch (SQLException e) {
            LOG.error("ClickHouse count sorgusunda hata", e);
            // Hata fırlatmıyoruz, 0 dönüyoruz (Tercihe bağlı)
        }
        return 0;
    }

    public List<LogData> findAll(int limit, int offset) {
        List<LogData> logs = new ArrayList<>();
        String sql = "SELECT * FROM log_data ORDER BY zaman DESC LIMIT ? OFFSET ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ps.setInt(2, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    logs.add(mapResultSetToLog(rs));
                }
            }
        } catch (SQLException e) {
            LOG.error("ClickHouse veri çekme hatası", e);
            throw new RuntimeException("Veritabanı hatası", e); // Servis katmanı yakalasın diye
        }
        return logs;
    }

    public void save(LogData log) throws SQLException {
        String sql = "INSERT INTO log_data (id, zaman, kaynak, sebep, mesaj, ip) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, log.id().toString());
            ps.setString(2, log.zaman());
            ps.setString(3, log.kaynak());
            ps.setString(4, log.sebep());
            ps.setString(5, log.mesaj());
            ps.setString(6, log.ip());
            ps.executeUpdate();
            LOG.infof("Yeni log kaydedildi: %s", log.id());
        } catch (SQLException e) {
            LOG.error("Log kaydetme hatası", e);
            throw e; // Controller yakalasın
        }
    }

    public List<StatDTO> getStats(String field, boolean excludeSuccess) {
        List<StatDTO> stats = new ArrayList<>();
        String whereClause = excludeSuccess ? " WHERE sebep != 'SUCCESS' " : "";
        String sql = "SELECT " + field + ", count() as toplam FROM log_data" + whereClause + " GROUP BY " + field;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                stats.add(new StatDTO(rs.getString(field), rs.getLong("toplam")));
            }
        } catch (SQLException e) {
            LOG.error("İstatistik hatası: " + field, e);
        }
        return stats;
    }

    // --- ELASTICSEARCH İŞLEMLERİ ---

    // GÜVENLİ QUERY OLUŞTURMA (Madde C Çözümü)
    public ElasticResult searchInElastic(String term, int limit, int offset) throws IOException {
        List<LogData> results = new ArrayList<>();

        // String.format yerine ObjectNode kullanıyoruz.
        // Bu sayede "term" içinde tırnak işareti olsa bile Jackson onu escape eder.
        ObjectNode queryRoot = objectMapper.createObjectNode();
        queryRoot.put("from", offset);
        queryRoot.put("size", limit);
        queryRoot.put("track_total_hits", true);

        ObjectNode multiMatch = objectMapper.createObjectNode();
        multiMatch.put("query", term);

        ArrayNode fields = multiMatch.putArray("fields");
        fields.add("mesaj").add("sebep").add("kaynak");

        queryRoot.putObject("query").set("multi_match", multiMatch);

        // Oluşan JSON: {"from":0, "size":10, "query": { "multi_match": { "query": "aranan kelime", ... }}}
        String jsonQuery = objectMapper.writeValueAsString(queryRoot);

        Request request = new Request("POST", "/logs/_search");
        request.setJsonEntity(jsonQuery);

        try {
            Response response = restClient.performRequest(request);
            JsonNode rootNode = objectMapper.readTree(response.getEntity().getContent());

            long total = rootNode.path("hits").path("total").path("value").asLong();
            JsonNode hits = rootNode.path("hits").path("hits");

            for (JsonNode hit : hits) {
                results.add(mapJsonToLog(hit.path("_source")));
            }
            return new ElasticResult(results, total);
        } catch (IOException e) {
            LOG.error("Elasticsearch arama hatası: " + term, e);
            throw e;
        }
    }

    public LogData findByIdInElastic(String id) throws IOException {
        // Güvenli ID sorgusu
        ObjectNode queryRoot = objectMapper.createObjectNode();
        queryRoot.putObject("query").putObject("term").put("id.keyword", id);

        String jsonQuery = objectMapper.writeValueAsString(queryRoot);

        Request request = new Request("POST", "/logs/_search");
        request.setJsonEntity(jsonQuery);

        Response response = restClient.performRequest(request);
        JsonNode rootNode = objectMapper.readTree(response.getEntity().getContent());
        JsonNode hit = rootNode.path("hits").path("hits").get(0);

        if (hit != null) {
            return mapJsonToLog(hit.path("_source"));
        }
        return null;
    }

    // --- YARDIMCI METOTLAR ---

    private LogData mapResultSetToLog(ResultSet rs) throws SQLException {
        return new LogData(
                UUID.fromString(rs.getString("id")),
                rs.getString("zaman"),
                rs.getString("kaynak"),
                rs.getString("sebep"),
                rs.getString("mesaj"),
                rs.getString("ip")
        );
    }

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

    public record ElasticResult(List<LogData> logs, long total) {}
}