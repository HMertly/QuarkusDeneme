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
    RestClient restClient; // Quarkus Elasticsearch Client

    private final ObjectMapper objectMapper = new ObjectMapper();

    // --- CLICKHOUSE: ANA LİSTE ---
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<LogData> getLogs(
            @QueryParam("kaynak") String kaynak,
            @QueryParam("search") String search) {

        List<LogData> logs = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT * FROM log_data WHERE 1=1");

        if (kaynak != null && !kaynak.isEmpty()) {
            sql.append(" AND kaynak = ?");
        }
        if (search != null && !search.isEmpty()) {
            sql.append(" AND (mesaj LIKE ? OR sebep LIKE ?)");
        }

        sql.append(" ORDER BY zaman DESC LIMIT 100");

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            int paramIndex = 1;
            if (kaynak != null && !kaynak.isEmpty()) {
                stmt.setString(paramIndex++, kaynak);
            }
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search + "%";
                stmt.setString(paramIndex++, searchPattern);
                stmt.setString(paramIndex++, searchPattern);
            }

            try (ResultSet rs = stmt.executeQuery()) {
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
        } catch (Exception e) {
            e.printStackTrace();
        }
        return logs;
    }

    // --- ELASTICSEARCH: HIZLI ARAMA ---
    @GET
    @Path("/search")
    @Produces(MediaType.APPLICATION_JSON)
    public List<LogData> searchLogs(@QueryParam("term") String term) throws IOException {
        List<LogData> results = new ArrayList<>();

        // Elasticsearch Query DSL
        String query = String.format(
                "{\"query\": {\"multi_match\": {\"query\": \"%s\", \"fields\": [\"mesaj\", \"sebep\", \"kaynak\"]}}}",
                term
        );

        Request request = new Request("POST", "/logs/_search");
        request.setJsonEntity(query);

        org.elasticsearch.client.Response response = restClient.performRequest(request);
        JsonNode rootNode = objectMapper.readTree(response.getEntity().getContent());
        JsonNode hits = rootNode.path("hits").path("hits");

        for (JsonNode hit : hits) {
            JsonNode source = hit.path("_source");
            results.add(new LogData(
                    UUID.fromString(source.path("id").asText()),
                    source.path("zaman").asText(),
                    source.path("kaynak").asText(),
                    source.path("sebep").asText(),
                    source.path("mesaj").asText(),
                    source.path("ip").asText()
            ));
        }
        return results;
    }

    // --- YAZMA İŞLEMİ (NiFi Buraya Gönderiyor) ---
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addLog(LogData log) {
        String sql = "INSERT INTO log_data (id, zaman, kaynak, sebep, mesaj, ip) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, log.getId() != null ? log.getId().toString() : UUID.randomUUID().toString());
            ps.setString(2, log.getZaman());
            ps.setString(3, log.getKaynak());
            ps.setString(4, log.getSebep());
            ps.setString(5, log.getMesaj());
            ps.setString(6, log.getIp());
            ps.executeUpdate();
            return Response.ok(log).build();
        } catch (SQLException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }
}