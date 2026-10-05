import { useCallback, useEffect, useRef, useState } from 'react';

/** Mensagem de retorno (sucesso/erro) que some sozinha após alguns segundos. */
export function useMensagem(duracaoMs = 6000) {
  const [mensagem, setMensagem] = useState(null);
  const temporizador = useRef(null);

  const mostrar = useCallback((tipo, texto) => {
    clearTimeout(temporizador.current);
    setMensagem({ tipo, texto });
    temporizador.current = setTimeout(() => setMensagem(null), duracaoMs);
  }, [duracaoMs]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return {
    mensagem,
    sucesso: texto => mostrar('sucesso', texto),
    erro: texto => mostrar('erro', texto),
    limpar: () => setMensagem(null)
  };
}
