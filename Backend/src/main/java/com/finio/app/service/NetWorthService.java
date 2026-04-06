package com.finio.app.service;

import com.finio.app.dto.NetWorthRequest;
import com.finio.app.dto.NetWorthResponse;
import com.finio.app.entity.NetWorthEntry;
import com.finio.app.entity.User;
import com.finio.app.repository.NetWorthRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NetWorthService {

    private final NetWorthRepository repo;

    public NetWorthService(NetWorthRepository repo) {
        this.repo = repo;
    }

    public NetWorthResponse create(NetWorthRequest req, User user) {
        NetWorthEntry entry = new NetWorthEntry();
        entry.setUser(user);
        entry.setName(req.name().trim());
        entry.setType(req.type());
        entry.setCategory(req.category());
        entry.setAmount(req.amount());
        entry.setDate(req.date());
        entry.setNote(req.note());
        return NetWorthResponse.from(repo.save(entry));
    }

    public List<NetWorthResponse> getAll(User user) {
        return repo.findByUserIdOrderByDateDescCreatedAtDesc(user.getId())
                .stream().map(NetWorthResponse::from).toList();
    }

    public NetWorthResponse update(Long id, NetWorthRequest req, User user) {
        NetWorthEntry entry = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        if (!entry.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        entry.setName(req.name().trim());
        entry.setType(req.type());
        entry.setCategory(req.category());
        entry.setAmount(req.amount());
        entry.setDate(req.date());
        entry.setNote(req.note());
        return NetWorthResponse.from(repo.save(entry));
    }

    public void delete(Long id, User user) {
        NetWorthEntry entry = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        if (!entry.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        repo.delete(entry);
    }
}