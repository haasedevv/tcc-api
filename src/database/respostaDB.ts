import { fecharConexao, iniciarConexao } from './index';
import RespostaDTO from '../dto/respostaDTO';

export async function getRespostas(id: String) {
    const pool = await iniciarConexao()
    try {
        const query = 'SELECT * FROM resposta where id_tarefa = $1'
        const value = [id]
        const result = await pool.query(query, value);
        fecharConexao(pool)
        return result.rows
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function getRespostasFromTarefa(id: String) {
    const pool = await iniciarConexao()
    try {
        const query = 'SELECT id, descricao, id_tarefa FROM resposta where id_tarefa = $1'
        const value = [id]
        const result = await pool.query(query, value);
        fecharConexao(pool)
        return result.rows
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    } 
}

export async function getResposta(id: String) {
    const pool = await iniciarConexao()
    try {
        const query = 'SELECT * FROM resposta where id = $1'
        const values = [id]
        const result = await pool.query(query, values)
        fecharConexao(pool)
        return result.rows[0]
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    } 
}

export async function verificaRespostaPertenceTarefa(idTarefa: string, idResposta: string) {
    const pool = await iniciarConexao()
    try {
        const query = 'select (count(*) > 0) as existe from resposta where id_tarefa = $1 and id = $2'
        const values = [idTarefa, idResposta]
        const result = await pool.query(query, values)
        fecharConexao(pool)
        return result.rows[0]
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function addResposta(resposta: RespostaDTO, idTarefa: String) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'INSERT INTO resposta (descricao, resposta_correta, id_tarefa) VALUES ($1, $2, $3) RETURNING *'
        const values = [resposta.descricao, resposta.resposta_correta, idTarefa]
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

export async function updateResposta(id: String, updatedResposta: RespostaDTO) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'UPDATE resposta SET descricao = $1, resposta_correta = $2, id_tarefa = $3 WHERE id = $4'
        const values = [updatedResposta.descricao, updatedResposta.resposta_correta, updatedResposta.idTarefa, id]
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

export async function deleteResposta(id: String) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'DELETE FROM resposta WHERE id = $1'
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

export async function deleteRespostasFromTarefa(id: String) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'DELETE FROM resposta WHERE id_tarefa = $1'
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