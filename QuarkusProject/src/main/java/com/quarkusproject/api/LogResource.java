package com.quarkusproject.api;

import com.quarkusproject.dto.DashboardResponse;
import com.quarkusproject.dto.LogData;
import com.quarkusproject.dto.LogResponse;
import com.quarkusproject.service.LogService;
import jakarta.inject.Inject;
import jakarta.validation.constraints.Min;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.IOException;
import java.sql.SQLException;

@Path("/api/logs")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LogResource {

    @Inject
    LogService logService; // Artık Repository değil Service kullanıyoruz

    @GET
    public LogResponse getLogs(
            @QueryParam("page") @DefaultValue("1") @Min(value=1, message="Sayfa sayısı en az 1 olmalıdır") int page,
            @QueryParam("size") @DefaultValue("10") @Min(value=1, message="Boyut en az 1 olmalıdır") int size) {

        return logService.getLogs(page, size);
    }

    @GET
    @Path("/search")
    public LogResponse searchLogs(
            @QueryParam("term") String term,
            @QueryParam("page") @DefaultValue("1") @Min(1) int page,
            @QueryParam("size") @DefaultValue("10") @Min(1) int size) throws IOException {

        return logService.searchLogs(term, page, size);
    }

    @GET
    @Path("/stats")
    public DashboardResponse getDashboardStats() {
        return logService.getDashboardStats();
    }

    @GET
    @Path("/{id}")
    public Response getLogById(@PathParam("id") String id) throws IOException {
        var log = logService.getLogById(id);
        if (log != null) {
            return Response.ok(log).build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @POST
    public Response addLog(LogData log) throws SQLException {
        // Validation: İleride LogData içine @NotNull ekleyerek burayı güçlendirebiliriz
        var savedLog = logService.createLog(log);
        return Response.ok(savedLog).build();
    }
}