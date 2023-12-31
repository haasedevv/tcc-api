import express, { Request } from 'express';
import { IRouter } from 'express';
import TarefaDTO from '../dto/tarefaDTO';
import { addTarefa, deleteTarefa, updateTarefa, getTarefasFromModule, getTarefaInformacaoGeral, getTarefasFiltrado } from '../database/tarefaDB'
import { addResposta, deleteRespostasFromTarefa, getRespostas, getRespostasFromTarefa } from '../database/respostaDB'
import RespostaDTO from '../dto/respostaDTO';
import { verificarToken } from '../middleware/auth';
import { getModuloProgresso } from '../database/moduloDB';
import ProgressoModuloDTO from '../dto/progressoModuloDTO';
import RetornoTarefaDTO from '../dto/retornoTarefaDTO';
import { addImagem, deleteImagem, getImagem } from '../database/imageDB';
import ImagemDTO from '../dto/imagemDTO';

const router: IRouter = express.Router();

export default router;

router.get('/tarefas', async (req, res) => {
    const verificacao = verificarTokenRequest(req);
    res.setTimeout(300000, () => {
        res.sendStatus(408); // Código de status 408 - Request Timeout
    });
    try {
        if (!verificacao) {
            res.status(401).json({ message: 'Token inválido' });
            return;
        }

        const idModulo = req.query['id_modulo'];
        if (!idModulo) {
            res.status(403).json({ message: 'Id do modulo não informado!' });
            return;
        }

        const tarefas = await getTarefasFiltrado(idModulo.toString());

        if (!tarefas) {
            throw new Error('Ocorreu um erro na busca de tarefas');
        }

        if (tarefas.length > 0) {
            for (const element of tarefas) {
                const respostaTarefa = await getRespostas(element.id.toString());

                if (!respostaTarefa) {
                    throw new Error('Erro enquanto buscava as respostas da tarefa');
                }

                element.respostas = respostaTarefa;

                if (element.tipo === 2) {
                    for (const resposta of element.respostas) {
                        const imagem = await getImagem(resposta.descricao.toString());
                        resposta.descricao = imagem.url;
                    }
                }
            }
        }

        res.status(201).json({ message: 'Tarefas encontradas', data: tarefas });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `Erro: ${error}` });
    }
});

router.get('/modulo-tarefas', async (req, res) => {
    const verificacao = verificarTokenRequest(req)
    if (verificacao) {
        try {
            const idUser = verificacao['id']
            const idModule = req.query['id_module']
            if(idModule == null || idModule == undefined) {
                res.status(403).json({message: 'Código do módulo não informado'})
                return
            }
            const moduloInformacao: ProgressoModuloDTO = await getModuloProgresso(idUser, idModule!.toString())
            if(moduloInformacao == null || moduloInformacao == undefined) {
                res.status(404).json({message: 'Módulo não encontrado'})
                return
            }
            const result = await getTarefasFromModule(idUser, idModule!.toString())
            var percProgresso = 0
            if(moduloInformacao.total > 0) {
                percProgresso = ((moduloInformacao.concluido / moduloInformacao.total) * 100)
            }
            res.status(201).json({message: 'Tarefas encontrado', data: {id_modulo: moduloInformacao.id, nome_modulo: moduloInformacao.nome, perc_completo: percProgresso.toFixed(2), tarefas: result}})
        } catch (error) {
            console.log(error)
            res.status(500).json({message: `Erro enquanto pegava todas as tarefas: ${error}`})
        }
    } else {
        res.status(401).json({ message: 'Token inválido' })
    }
});

router.get('/tarefa', async (req, res) => {
    const verificacao = verificarTokenRequest(req)
    if (verificacao) {
        try {
            const idUser = verificacao['id']
            const id = req.query['id']
            if(id == null || id == undefined) {
                res.status(403).json({message: 'Código do Tarefa não informado'})
                return
            }
            const result: TarefaDTO = await getTarefaInformacaoGeral(id!.toString())
            if(result == undefined || result == null) {
                res.status(404).json({message: 'Tarefa não encontrado'})
                return
            }
            const moduloInformacao: ProgressoModuloDTO = await getModuloProgresso(idUser, result!.id_modulo)
            if(moduloInformacao == null || moduloInformacao == undefined) {
                res.status(404).json({message: 'Módulo não encontrado'})
                return
            }
            var percProgresso = 0
            if(moduloInformacao.total > 0) {
                percProgresso = (moduloInformacao.concluido / moduloInformacao.total) * 100
            }
            const respostaTarefa: RespostaDTO[] = await getRespostasFromTarefa(result.id)
            if(respostaTarefa.length == 0) {
                res.status(500).json({message: `Erro enquanto buscavas as respostas da tarefa`})
                return
            }
            const retornoTarefa: RetornoTarefaDTO = await criarTarefaRetorno(result, respostaTarefa)
            res.status(201).json({message: 'Tarefa encontrado', data: {id_modulo: moduloInformacao.id, nome_modulo: moduloInformacao.nome, perc_completo: percProgresso.toFixed(2), tarefa: retornoTarefa}})
        } catch (error) {
            console.log(error)
            res.status(500).json({message: `Erro enquanto pegava uma tarefa: ${error}`})
        }
    } else {
        res.status(401).json({ message: 'Token inválido' })
    }
});

router.post('/tarefa', async (req, res) => {
    const verificacao = verificarTokenRequest(req)
    if (verificacao) {
        const novaTarefa: TarefaDTO = req.body
        try {
            if(novaTarefa.id_modulo == null || novaTarefa.id_modulo == undefined) {
                res.status(403).json({message: 'Código do modulo não informado'})
                return
            }
            const exp = parseInt(novaTarefa.tarefa_exp.toString())
            const verificacaoExp = verificarExp(exp)
            if(verificacaoExp.length != 0) {
                res.status(403).json({message: verificacaoExp})
                return
            }
            const newTask: TarefaDTO = await addTarefa(novaTarefa);
            var respostas: RespostaDTO[] = []
            for (let index = 0; index < novaTarefa.respostas.length; index++) {
                var resp = novaTarefa.respostas[index];
                resp.resposta_correta = index == novaTarefa.index_resp
                if(newTask.tipo == 2) {
                    var imagemSalva: ImagemDTO = await addImagem(resp.descricao.toString())
                    resp.descricao = imagemSalva.id
                    var result: RespostaDTO = await addResposta(resp, newTask.id)
                    respostas.push(result)
                } else {
                    var result: RespostaDTO = await addResposta(resp, newTask.id)
                    respostas.push(result)
                }              
            }
            newTask.respostas = respostas
            res.status(201).json({message: 'Tarefa criada com sucesso', data: newTask})
        } catch(error) {
            console.log(error)
            res.status(500).json({message: `Erro enquanto criava a tarefa: ${error}`})
        }
    } else {
        res.status(401).json({ message: 'Token inválido' })
    }
});

router.put('/tarefa', async (req, res) => {
    const verificacao = verificarTokenRequest(req)
    if (verificacao) {
        try {
            const tarefaAtualizado: TarefaDTO = req.body
            if(tarefaAtualizado == null || tarefaAtualizado == undefined) {
                res.status(403).json({message: 'Informações incorretas'})
                return
            }
            if(tarefaAtualizado.id_modulo == null || tarefaAtualizado.id_modulo == undefined) {
                res.status(403).json({message: 'Código do modulo não informado'})
                return
            }
            const exp = parseInt(tarefaAtualizado.tarefa_exp.toString())
            const verificacaoExp = verificarExp(exp)
            if(verificacaoExp.length != 0) {
                res.status(403).json({message: verificacaoExp})
                return
            }
            if(tarefaAtualizado.tipo == 2) {
                const respostasOriginal = await getRespostasFromTarefa(tarefaAtualizado.id)
                for (let index = 0; index < respostasOriginal.length; index++) {
                    const element = respostasOriginal[index];
                    deleteImagem(element.descricao)
                }
            }
            await deleteRespostasFromTarefa(tarefaAtualizado.id)
            for (let index = 0; index < tarefaAtualizado.respostas.length; index++) {
                var resp = tarefaAtualizado.respostas[index];
                resp.resposta_correta = index == tarefaAtualizado.index_resp
                if(tarefaAtualizado.tipo == 2) {
                    var imagemSalva: ImagemDTO = await addImagem(resp.descricao.toString())
                    resp.descricao = imagemSalva.id
                    await addResposta(resp, tarefaAtualizado.id)
                } else {
                    await addResposta(resp, tarefaAtualizado.id)
                }              
            }
            const result = await updateTarefa(tarefaAtualizado!.id.toString(), tarefaAtualizado)
            if(result) {
                res.status(201).json({message: 'Tarefa Atualizado'})
            } else {
                res.status(404).json({message: 'Tarefa não encontrado'})
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({message: `Erro enquanto atualizava a tarefa: ${error}`})
        }
    } else {
        res.status(401).json({ message: 'Token inválido' })
    }
});

router.delete('/tarefa', async (req, res) => {
    const verificacao = verificarTokenRequest(req)
    if (verificacao) {
        try {
            const id = req.query['id']
            if(id == null || id == undefined) {
                res.status(403).json({message: 'Código do tarefa não informado'})
                return
            }
            const result = await deleteTarefa(id!.toString())
            if(result) {
                res.status(201).json({message: 'Tarefa deletado'})
            } else {
                res.status(404).json({message: 'Tarefa não encontrado'})
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({message: `Erro enquanto deletava a tarefa: ${error}`})
        }
    } else {
        res.status(401).json({ message: 'Token inválido' })
    }
});

function verificarTokenRequest(req: Request) {
    try {
        const token = req.header('Authorization')
        const decoded = verificarToken(token!.split(" ").at(-1)!)
        return decoded
    } catch (error) {
        console.log(error)
        return
    }
}

async function criarTarefaRetorno(tarefa: TarefaDTO, respostas: RespostaDTO[]) {
    switch(tarefa.tipo) {
        case 1:
            var descricao = tarefa.conteudo
            descricao = replaceAll(descricao as string, "$variavel", "______")
            return new RetornoTarefaDTO(tarefa.id, tarefa.nome, descricao, tarefa.tipo, respostas)
        case 2:
            for (let index = 0; index < respostas.length; index++) {
                const element = respostas[index];
                const imagem: ImagemDTO = await getImagem(element.descricao.toString())
                element.descricao = imagem.url
            }
            return new RetornoTarefaDTO(tarefa.id, tarefa.nome, tarefa.conteudo, tarefa.tipo, respostas)
        default:
            return new RetornoTarefaDTO(tarefa.id, tarefa.nome, tarefa.conteudo, tarefa.tipo, respostas)
    }
}

function replaceAll(string: string, search: string, replace: string) {
    return string.split(search).join(replace);
}

function verificarExp(exp: number) {
    if(exp == null || exp == undefined) {
        return 'Informações incorretas: EXP'    
    }    
    
    if(exp <= 0) {
        return 'Informações incorretas: EXP deve ser maior que zero'
    }

    return ""
}