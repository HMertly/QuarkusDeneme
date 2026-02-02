package com.quarkusproject.api;

import com.quarkusproject.dto.DashboardResponse;
import com.quarkusproject.dto.LogData;
import com.quarkusproject.dto.LogResponse;
import com.quarkusproject.repository.LogRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.IOException;
import java.sql.SQLException;
import java.util.UUID;

@Path("/api/logs")
public class LogResource {

    @Inject
    LogRepository logRepository;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public LogResponse getLogs(
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("10") int size) {

        int offset = (page - 1) * size;
        var logs = logRepository.findAll(size, offset);
        var total = logRepository.getTotalCount();
        return new LogResponse(logs, total);
    }

    @GET
    @Path("/search")
    @Produces(MediaType.APPLICATION_JSON)
    public LogResponse searchLogs(
            @QueryParam("term") String term,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("10") int size) throws IOException {

        int offset = (page - 1) * size;
        var result = logRepository.searchInElastic(term, size, offset);
        return new LogResponse(result.logs(), result.total());
    }

    @GET
    @Path("/stats")
    @Produces(MediaType.APPLICATION_JSON)
    public DashboardResponse getDashboardStats() {
        var kaynakDagilimi = logRepository.getStats("kaynak", false);
        var hataDagilimi = logRepository.getStats("sebep", true);
        return new DashboardResponse(kaynakDagilimi, hataDagilimi);
    }

    @GET
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLogById(@PathParam("id") String id) throws IOException {
        var log = logRepository.findByIdInElastic(id);
        if (log != null) {
            return Response.ok(log).build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addLog(LogData log) {
        // Record immutable olduğu için ID yoksa yeni bir Record oluşturmamız lazım
        LogData logToSave = log;
        if (log.id() == null) {
            logToSave = new LogData(UUID.randomUUID(), log.zaman(), log.kaynak(), log.sebep(), log.mesaj(), log.ip());
        }

        try {
            logRepository.save(logToSave);
            return Response.ok(logToSave).build();
        } catch (SQLException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }
}