import { Box, Text, TextField, Image, Button } from '@skynexui/components';
import React, { useState, useEffect } from 'react';
import appConfig from '../config.json';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/router"
import { ButtonSendSticker } from '../src/components/ButtonSendSticker';


const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzMwMTM3NCwiZXhwIjoxOTU4ODc3Mzc0fQ.fsypNIXgb9gwH2w8DGj5q1Jz4XPkOEOrsFRsUKD_t6A'
const SUPABASE_URL = 'https://bzgfyebzyyhlqqsonjxh.supabase.co'
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function escutaMensagemEmTempoReal(adcionaMensagem){
    return supabaseClient
        .from('mensagens')
        .on('INSERT', ( respostaLive  ) =>{
            adcionaMensagem(respostaLive.new);
        })
        .subscribe();
}


export default function ChatPage() {
    const [textoAtual, setTextoAtual] = useState('')
    const [listaDeMensagens, setListaDeMensagens] = useState([])
    const [hidden, setHidden] = useState(false)

    const roteamento = useRouter()
    const usuarioLogado = roteamento.query.username

    const Loading = ({isHidden}) => {
        if (isHidden) {
            return ''
        }
        return (
            <Text variant='heading5'>
                Carregando...
            </Text>
        )
    }

    React.useEffect(()=>{
        supabaseClient
            .from('mensagens')
            .select('*')
            .order('id', { ascending: false})
            .then(( {data})=>{
                console.log('Dados da consulta', data);
                setListaDeMensagens(data);
            });
            setHidden(true)
            escutaMensagemEmTempoReal((novaMensagem)=>{
                console.log('Nova Mensagem', novaMensagem);
                if(usuarioLogado != novaMensagem.de){
                    let audio = new Audio(appConfig.soundMiranha);
                    audio.play();
                }
                setListaDeMensagens((valorAtualDaLista)=>{
                    return[
                        novaMensagem,
                        ...valorAtualDaLista,
                    ]
                });
            });
    }, []);
    
    function handleNovaMensagem(novaMensagem) {
        const mensagemEnviada = {
            de: usuarioLogado,
            texto: novaMensagem
        }
        
        supabaseClient
            .from('mensagens')
            .insert([
                mensagemEnviada
            ])
            .then(( {data})=>{
                console.log('Criando Mensagem: ', data);
                // setListaMensagens([
                //     data[0],
                //     ...listaDeMensagens,
                // ]);
            })     

        setTextoAtual('');
    }

    function handleDeletarMensagem(idMensagem) {
        setListaDeMensagens(listaDeMensagens.filter(item => item.id != idMensagem))
    }

    return (
        
        <Box
            styleSheet={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: appConfig.theme.colors.primary[500],
                backgroundImage: `url(https://virtualbackgrounds.site/wp-content/uploads/2020/08/the-matrix-digital-rain.jpg)`,
                backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundBlendMode: 'multiply',
                color: appConfig.theme.colors.neutrals['000']
            }} 
        >
            
            <Box
                styleSheet={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    boxShadow: '0 2px 10px 0 rgb(0 0 0 / 20%)',
                    borderRadius: '5px',
                    backgroundColor: appConfig.theme.colors.neutrals[700],
                    height: '100%',
                    maxWidth: '95%',
                    maxHeight: '95vh',
                    padding: '32px',
                }}
            >
                <Header />
                <Box
                    styleSheet={{
                        position: 'relative',
                        display: 'flex',
                        flex: 1,
                        height: '80%',
                        backgroundColor: appConfig.theme.colors.neutrals[600],
                        flexDirection: 'column',
                        borderRadius: '5px',
                        padding: '16px',
                    }}
                >
                    <Loading isHidden={hidden} />
                    <MessageList mensagens={listaDeMensagens} deletarMensagem={handleDeletarMensagem} />

                    <Box
                        as="form"
                        styleSheet={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <TextField
                            id="area-de-texto"
                            value={textoAtual}
                            onChange={event => {
                                const valor = event.target.value
                                setTextoAtual(valor)
                            }}
                            onKeyPress={event => {
                                if (event.key === 'Enter') {
                                    event.preventDefault()

                                    handleNovaMensagem(event.target.value)                                    
                                }
                            }}
                            placeholder="Insira sua mensagem aqui..."
                            type="textarea"
                            styleSheet={{
                                width: '100%',
                                border: '0',
                                resize: 'none',
                                borderRadius: '5px',
                                padding: '6px 8px',
                                backgroundColor: appConfig.theme.colors.neutrals[800],
                                marginRight: '12px',
                                color: appConfig.theme.colors.neutrals[200],
                            }}
                        />
                        <ButtonSendSticker onStickerClick={sticker => handleNovaMensagem(':sticker:' + sticker)} />
                        <Button
                            type='button'
                            label='Enviar'
                            onClick={event => handleNovaMensagem(textoAtual)}
                            buttonColors={{
                                contrastColor: appConfig.theme.colors.neutrals["000"],
                                mainColor: appConfig.theme.colors.primary[500],
                                mainColorLight: appConfig.theme.colors.primary[400],
                                mainColorStrong: appConfig.theme.colors.primary[600],
                            }}
                            disabled={!textoAtual}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

function Header() {
    return (
        <>
            <Box styleSheet={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
                <Text variant='heading5'>
                    Chat
                </Text>
                <Button
                    variant='tertiary'
                    colorVariant='neutral'
                    label='Logout'
                    href="/"
                />
            </Box>
        </>
    )
}

function MessageList({ mensagens, deletarMensagem }) {
    return (
        <Box
            tag="ul"
            styleSheet={{
                overflow: 'scroll',
                display: 'flex',
                flexDirection: 'column-reverse',
                flex: 1,
                color: appConfig.theme.colors.neutrals["000"],
                marginBottom: '16px',
            }}
        >
            {mensagens.map(mensagem => {
                return (
                    
                    <Text
                        key={mensagem.id}
                        tag="li"
                        styleSheet={{
                            borderRadius: '5px',
                            padding: '6px',
                            marginBottom: '12px',
                            hover: {
                                backgroundColor: appConfig.theme.colors.neutrals[700],
                            }
                        }}
                    >
                        
                        <Box
                            styleSheet={{
                                marginBottom: '8px'
                            }}
                        >
                            
                            <Image
                                styleSheet={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    marginRight: '8px',
                                }}
                                src={`https://github.com/${mensagem.de}.png`}
                            />
                            <Text tag="strong">
                                {mensagem.de}
                            </Text>
                            <Text
                                styleSheet={{
                                    fontSize: '10px',
                                    marginLeft: '8px',
                                    color: appConfig.theme.colors.neutrals[300],
                                }}
                                tag="span"
                            >
                                {(new Date().toLocaleDateString())}
                            </Text>
                            <Button
                                type='button'
                                iconName='times'
                                onClick={event => deletarMensagem(mensagem.id)}
                                style={{position: 'absolute', right: 32, backgroundColor: 'transparent', border: 'none', outline: 'noneoutline'}}
                            />
                        </Box>
                        {mensagem.texto.startsWith(':sticker:') ?
                        (<Image src={mensagem.texto.replace(':sticker:', '')} />):
                        mensagem.texto}
                
                    </Text>
                    
                )
            })}
        </Box>            
    )
    
        
}

