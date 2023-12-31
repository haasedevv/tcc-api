import RankingDTO from '../dto/rankingDTO';
import { fecharConexao, iniciarConexao } from './index';

export async function getUsersRanking() {
    const pool = await iniciarConexao()
    try {
        const result = await pool.query('SELECT r.nome, r.user_level, r.user_exp, a.url FROM ranking r JOIN usuario u ON u.id = r.id_usuario JOIN avatar a ON a.id = u.id_avatar ORDER BY user_level DESC, user_exp DESC')
        fecharConexao(pool)
        return result.rows
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function getUserRanking(id: string) {
    const pool = await iniciarConexao()
    try {
        const query = 'SELECT * FROM ranking WHERE id_usuario = $1'
        const result = await pool.query(query, [id])
        fecharConexao(pool)
        return result.rows[0]
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    } 
}

export async function createUserRanking(users: RankingDTO[]) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        var query = 'INSERT INTO ranking (id_usuario, nome, user_level, user_exp) VALUES '
        for (let index = 0; index < users.length; index++) {
            const element = users[index];
            if((index + 1) == users.length) {
                query = query + `(${element.id_usuario}, '${element.nome}', ${element.user_level}, ${element.user_exp})`
            } else {
                query = query + `(${element.id_usuario}, '${element.nome}', ${element.user_level}, ${element.user_exp}), `
            }
        }
        const result = await client.query(query)
        client.release()
        fecharConexao(pool)
        return result.rows
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
        throw error
    }
}

export async function updateUserRanking(id: string, user: RankingDTO) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'UPDATE ranking SET nome = $1, user_level = $2, user_exp = $3 WHERE id_usuario = $4'
        const values = [user.nome, user.user_level, user.user_exp, id]
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

export async function deleteUserRanking(id: string) {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'DELETE FROM ranking WHERE id = $1'
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

export async function deleteAllUsersRanking() {
    const pool = await iniciarConexao()
    try {
        const client = await pool.connect()
        const query = 'TRUNCATE ranking'
        const result = await client.query(query)
        client.release()
        fecharConexao(pool)
        return result.rowCount == 0
    } catch (error) {
        console.log(error)
        fecharConexao(pool)
    }
}
