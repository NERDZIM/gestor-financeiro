package com.mk.gestor_financeiro.repository;

import com.mk.gestor_financeiro.model.Transacao;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransacaoRepository extends JpaRepository<Transacao, Long> {

    List<Transacao> findByUsuarioId(Long usuarioId);
}
