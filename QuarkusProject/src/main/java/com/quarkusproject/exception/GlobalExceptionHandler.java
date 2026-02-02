package com.quarkusproject.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.sql.SQLException;
import java.io.IOException;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {

    @Override
    public Response toResponse(Exception exception) {
        // Prod ortamında loglama kütüphanesi (SLF4J) kullanılmalı
        // System.err.println("Hata Detayı: " + exception.getMessage());

        int status = 500;
        String message = "Sunucu tarafında beklenmeyen bir hata oluştu.";

        if (exception instanceof SQLException) {
            // Güvenlik: Asla gerçek SQL hatasını kullanıcıya dönme!
            message = "Veritabanı işlemi sırasında hata oluştu.";
        } else if (exception instanceof IOException) {
            message = "Veri erişim hatası (Elasticsearch/Disk).";
        } else if (exception instanceof IllegalArgumentException) {
            status = 400;
            message = exception.getMessage();
        }

        return Response.status(status)
                .entity(new ErrorResponse(message, status))
                .build();
    }

    // Basit bir hata DTO'su
    public record ErrorResponse(String message, int statusCode) {}
}