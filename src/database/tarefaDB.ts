import { fecharConexao, iniciarConexao } from './index';
import TarefaDTO from '../dto/tarefaDTO';

export async function getTarefas() {
    const pool = await iniciarConexao()
    try {
        const result = await pool.query('SELECT * FROM tarefa');
        fecharConexao(pool)
        return result.rows
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function getTarefasFiltrado(idModule: String) {
    const pool = await iniciarConexao()
    try {
        const result = await pool.query('SELECT * FROM tarefa where id_modulo = $1', [idModule]);
        fecharConexao(pool)
        return result.rows
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function getTarefasFromModule(idUser: String, idModule: String) {
    const pool = await iniciarConexao()
    try {
        const query = 'SELECT t.*, (SELECT (count(*) > 0) as completo FROM tarefa_feita tf WHERE tf.id_tarefa = t.id and tf.id_usuario = $1) FROM tarefa t WHERE t.id_modulo = $2'
        const values = [idUser, idModule]
        const result = await pool.query(query, values);
        fecharConexao(pool)
        return result.rows
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function getTarefasConcluidasFromModule(id: String, idUser: String) {
    const pool = await iniciarConexao()
    try {
        const query = 'select (select count(*) from tarefa as tar where id_modulo = $1) as tarefas,' +
        '(select count(*) from tarefa as tar inner join tarefa_feita as tarf on tar.id = tarf.id_tarefa where id_modulo = $1 and tarf.id_usuario = $2) as tarefa_feitas;'
        const result = await pool.query(query, [id, idUser]);
        fecharConexao(pool)
        return result.rows[0]
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function getTarefa(id: String) {
    const pool = await iniciarConexao()
    try {
        const query = 'SELECT * FROM tarefa where id = $1'
        const result = await pool.query(query, [id])
        fecharConexao(pool)
        return result.rows[0]
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function getTarefaInformacaoGeral(id: String) {
    const pool = await iniciarConexao()
    try {
        const query = 'SELECT id, nome, conteudo, tipo, id_modulo FROM tarefa where id = $1'
        const result = await pool.query(query, [id])
        fecharConexao(pool)
        return result.rows[0]
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function addTarefa(tarefa: TarefaDTO) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'INSERT INTO tarefa (nome, conteudo, tipo, tarefa_exp, id_modulo) VALUES ($1, $2, $3, $4, $5) RETURNING *'
        const values = [tarefa.nome, tarefa.conteudo, tarefa.tipo, tarefa.tarefa_exp, tarefa.id_modulo]
        const result = await client.query(query, values)
        client.release()
        fecharConexao(pool)
        return result.rows[0]
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function updateTarefa(id: String, updatedTarefa: TarefaDTO) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'UPDATE tarefa SET nome = $1, conteudo = $2, tipo = $3, tarefa_exp = $4, id_modulo = $5 WHERE id = $6'
        const values = [updatedTarefa.nome, updatedTarefa.conteudo, updatedTarefa.tipo, updatedTarefa.tarefa_exp, updatedTarefa.id_modulo, id]
        const result = await client.query(query, values)
        client.release()
        fecharConexao(pool)
        return result.rowCount > 0
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function deleteTarefa(id: String) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'DELETE FROM tarefa WHERE id = $1'
        const values = [id]
        const result = await client.query(query, values)
        client.release()
        fecharConexao(pool)
        return result.rowCount > 0
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}