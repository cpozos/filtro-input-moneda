var MASCARA_CONTABLE = (function(){
    var _elementos =[];
    var _keyPressedCode;
    var _datoIngresadoValido = false;

    /**
    * Callback que recibe el valor después del proceso realizado por la máscara.
    *
    * @callback funcionPostFormato
    * @param {string} valorPostFormato - Valor posterior al proceso de formato.
    */

    /**
    * Asigna una máscara a un elemento input para asegurarse que se tenga en todo momento el formato requerido.
    * @param {string} idInput 
    * @param {funcionPostFormato} onPostFormato - Función call back que se manda a llamar una vez que la máscara ha finalizado de analizar lo ingresado.
    * @param {string} valorInicial - Valor incial que se le asigna al input.
    */
    function setMascara(idElemento, funcionCallBack, valorInicial){
        var elemento = document.getElementById(idElemento);
        elemento.value = valorInicial || "0.00";
        elemento.oldValue = elemento.value;

        // Agregar elemento con su callback a las variables
        _elementos.push({idElemento:idElemento, funcionCallBack: funcionCallBack});

        elemento.addEventListener('input',aplicarFormato);
        elemento.addEventListener('keydown',_setCodigoTecla);        
    }

    function aplicarFormato(event){

        // Si las teclas que se presionaron son de navegación, no hace nada.
        if(_keyPressedCode > 36 && _keyPressedCode < 41)
            return;

        // Elemento
        var inputElement = event.target;
        var strMonto = inputElement.value;
        var strMontoSinComas = null;

        // Posición del cursor
        var posicionCursor = inputElement.selectionStart;
        var posicionCursorDerechaIzquierda = inputElement.value.length - posicionCursor;
        var posicionCursorFinal = null;

        // Solo se puede realizar una modificación a la vez (se agregó o borro un caractér)
        var numeroModificaciones = inputElement.value.length - aplicarFormatoMoneda(inputElement.oldValue).length;
        numeroModificaciones = numeroModificaciones < 0 ? numeroModificaciones * -1 : numeroModificaciones;

        // Si no se ingresó un dato válido o fueron más de una modificación, regresa al valor anterior (no permite el cambio)
        if(!_datoIngresadoValido ||  numeroModificaciones > 1 ){
            _mantenerValorAnterior(inputElement);
            return;
        }

        // Variables relacionadas con la tecla presionada
        var btnDelete = _keyPressedCode === 8;
        var btnSuprimir = _keyPressedCode == 46;
        var seBorroUnDato = btnDelete || btnSuprimir;

        
        if(seBorroUnDato){
             // Se determina si se borró una coma o un punto
            var seBorroPunto = !strMonto.includes('.');
            var intNumeroComasAnteriores = obtenerNumeroCaracteresPresentes(aplicarFormatoMoneda(inputElement.oldValue),',');
            var intNumeroComasActuales = obtenerNumeroCaracteresPresentes(strMonto, ',');
            var seBorroComa = intNumeroComasAnteriores>intNumeroComasActuales;
 
            // Si se borró una coma o un punto
            if(seBorroComa || seBorroPunto){
                
                // Caracter unión
                var caracterJoin = seBorroPunto ? '.':',';

                // Si delete => quitar elemento a la izquierda del cursor
                if(btnDelete){
                    strMonto = _replaceElementoIzquierda(strMonto,posicionCursor,caracterJoin);
                }
                // Si suprimir => quitar elemento a la derecha del cursor
                else{
                    strMonto = _replaceElementoDerecha(strMonto,posicionCursor,caracterJoin);
                }

                // Limpia las comas
                strMontoSinComas = borrarCaracter(strMonto,',');

            }
            // Se borró un número
            else{
                
                var posicionPunto = strMonto.indexOf('.');
                var seModificoParteDecimal = posicionCursor > posicionPunto;

                if(seModificoParteDecimal){
                    strMonto = _recorrerPuntoDecimalIzquierda(strMonto);
                }
                
                // Limpia las comas
                strMontoSinComas = borrarCaracter(strMonto,',');
            }
        }
        else{
            //Limpiar comas
            strMontoSinComas = borrarCaracter(strMonto,',');

            // Modificación en la parte decimal o entera
            var posicionPunto = strMonto.indexOf('.');
            var seModificoParteDecimal = posicionPunto < posicionCursor;

            if(seModificoParteDecimal){
                strMontoSinComas = _recorrerPuntoDecimalDerecha(strMontoSinComas);
            }

            // Menor a diez millones
            if(!(parseInt(strMontoSinComas)<10000000)){
                _mantenerValorAnterior(inputElement);
                return;
            }
        }

        // Si no hubo cambio, regresa al valor anterior y no notifica al callback
        var strMontoFinal = aplicarFormatoMoneda(strMontoSinComas);
        if(!(strMontoFinal !== aplicarFormatoMoneda(inputElement.oldValue))){
            _mantenerValorAnterior(inputElement);
            return;
        }

        // Asigna valores
        inputElement.oldValue = strMontoSinComas;
        inputElement.value = strMontoFinal;

        // Posicion
        if(!seBorroUnDato){
            posicionCursorFinal = seModificoParteDecimal ? inputElement.value.length - posicionCursorDerechaIzquierda : posicionCursor;    
        }
        else if(seBorroPunto){
            posicionCursorFinal = inputElement.value.length - posicionCursorDerechaIzquierda;
            posicionCursorFinal = btnSuprimir ? posicionCursorFinal-1 : posicionCursorFinal;
        }
        else if(seBorroComa){
            posicionCursorFinal = inputElement.value.length - posicionCursorDerechaIzquierda;
            if(btnDelete){
                posicionCursorFinal = posicionCursorFinal !== 0 ? posicionCursorFinal : 1; 
            }
            else if(btnSuprimir){
                posicionCursorFinal = posicionCursorFinal !== 0 ? posicionCursorFinal-1 : 1;
            }
            posicionCursorFinal = posicionCursorFinal < 0 ? 0 : posicionCursorFinal;
        }
        else {
            if(seModificoParteDecimal){
                posicionCursorFinal = inputElement.value.length - posicionCursorDerechaIzquierda ;
            }
            else{
                if(btnDelete){
                    posicionCursorFinal = posicionCursor > 0 ? posicionCursor : 1;
                }   
                else if(btnSuprimir){
                    posicionCursorFinal = posicionCursor;
                }
            }
            
        }
            
        // Notifica a la función call back si hubo un cambio
        var callback = _obtenerFuncionCallBackDelElemento(inputElement.id);
        if(callback){
            callback(strMontoSinComas);
        }

        // Posición del cursor
        setCaretPosicion(inputElement.id, posicionCursorFinal);
    }

    function _setCodigoTecla(event){
        _keyPressedCode = event.which || event.keyCode;

        _datoIngresadoValido =
         _keyPressedCode === 8
         || _keyPressedCode ===46
         || _keyPressedCode >=48 && _keyPressedCode<=57 || _keyPressedCode>=96 && _keyPressedCode<=105;
    }

    /**
     * Mantiene el valor almacenado en la propiedad oldValue del elemento input, así como la posición del cursor.
     */
    function _mantenerValorAnterior(elemento){
        var posicionCursorFinal = elemento.selectionStart - 1;
        posicionCursorFinal = posicionCursorFinal < 0 ? 0 : posicionCursorFinal;
        elemento.value = aplicarFormatoMoneda(elemento.oldValue);
        setCaretPosicion(elemento.id, posicionCursorFinal);
    }

    /**
    * Obtiene la función call back que se le asignó al elemento.
    * @param {string} idElemento - Identificador del elemento
    */
    function _obtenerFuncionCallBackDelElemento(idElemento){
        for (var i = 0; i < _elementos.length; i++) {
            var elemento = _elementos[i];
            if(idElemento === elemento.idElemento){
                return elemento.funcionCallBack;
            }
        }
        return null;
    }

    function _recorrerPuntoDecimalIzquierda(valor){
        var strParteIzquierda = valor.split('.')[0];
        var strParteDerecha = valor.split('.')[1];
        
        strParteDerecha = strParteIzquierda[strParteIzquierda.length-1]+strParteDerecha;
        strParteIzquierda = strParteIzquierda.substring(0,strParteIzquierda.length-1);

        strParteIzquierda = strParteIzquierda || '0';
        strParteDerecha = strParteDerecha || '0';

        return strParteIzquierda + '.' + strParteDerecha;
    }

    function _recorrerPuntoDecimalDerecha(valor){
        var strParteIzquierda = valor.split('.')[0];
        var strParteDerecha = valor.split('.')[1];
        
        strParteIzquierda = strParteIzquierda + strParteDerecha[0];
        strParteDerecha = strParteDerecha.substring(1);

        strParteIzquierda = strParteIzquierda || '0';
        strParteDerecha = strParteDerecha || '0';

        return strParteIzquierda + '.' + strParteDerecha;
    }

    function _replaceElementoIzquierda(valor, indice, caracterUnion){
        caracterUnion = caracterUnion || '';
        var strPrimeraParte = valor.substring(0,indice);
        var strSegundaParte = valor.substring(indice,valor.length);
        
        return strPrimeraParte.substring(0, strPrimeraParte.length-1) + caracterUnion + strSegundaParte;
    }

    function _replaceElementoDerecha(valor, indice, caracterUnion){
        caracterUnion = caracterUnion || '';
        var strPrimeraParte = valor.substring(0,indice);
        var strSegundaParte = valor.substring(indice,valor.length);
        
        return strPrimeraParte + caracterUnion + strSegundaParte.substring(1,strSegundaParte.length);
    }

    /**
    * Aplica el formato de moneda a una cadena string que representa una cantidad monetaria.
    * @param {string} cantidad - Cadena string que representa un número que es una cantidad monetaria.
    * @param {number} decimales - Número entero que representa el número de decimales con los que se está trabajando.
    * @param {bool} quitarPrefijos - Indica si se quitará el prefijo 'MX$' que proporciona por defecto la función debido a que utiliza Intl.NumberFormat.
    */
    function aplicarFormatoMoneda(cantidad, decimales, quitarPrefijos){
        decimales = decimales || 2;
        quitarPrefijos = !quitarPrefijos ? true : quitarPrefijos;

        var formatter = new Intl.NumberFormat('en-US',{
            style: 'currency',
            currency: 'MXN'
        });

        cantidad = parseFloat(cantidad) ? parseFloat(cantidad) : 0;

        cantidad = formatter.format(parseFloat(cantidad).toFixed(decimales));

        if(!quitarPrefijos){
            return cantidad;
        }

        var cantidadSinPrefijos = "";

        for(var i=0; i<cantidad.length; i++){
            var letra = cantidad[i];

            if(/[-.,\d]/.test(letra)){
                cantidadSinPrefijos += letra;
            }
        }
        return cantidadSinPrefijos;
    }

    /**
    * Posiciona el cursor o caret dentro de un elemento input en la posición indicada.
    * @param {string} elemId - Identificador del elemento input.
    * @param {int} caretPos - Posición en la que se desea colocar al cursor
    */
    function setCaretPosicion(idElemento,caretPos){
        var elem = document.getElementById(idElemento);

        if(elem != null){
            if(elem.createTextRange){
                var range = elem.createTextRange();
                range.move('character', caretPos);
                range.select();
            }
            else{
                if(elem.selectionStart || elem.selectionStart === 0){
                    elem.focus();
                    elem.setSelectionRange(caretPos,caretPos);
                }
                else
                    elem.focus();
            }
        }
    }

    /** 
    * Quita todos los caracteres iguales al parametro caracter que se encuentran en la cadena.
    * @param {string} valor - Cadena a la que se le quitarán todos los carácteres.
    * @param {char} caracter - Caracter que se va a eliminar por completo de la cadena
    */
    function borrarCaracter(valor, caracter){
        if(!caracter || !valor)
            return valor;

        while(valor.includes(caracter)){
            valor = valor.replace(caracter,'');
        }

        return valor;
    }

    /**
    * Obtiene el número de veces que se encuentra presente un caracter en un string.
    * @param {string} valor - Cadena a evaluar
    * @param {char} caracter - Caracter
    */
    function obtenerNumeroCaracteresPresentes(valor, caracter){
        var numeroComas = 0;
        for (var i = 0; i < valor.length; i++) {
            if(valor[i]!== caracter)
                continue;
            numeroComas ++;
        }
        return numeroComas;
    }

    return {
        setMascara: setMascara  
    }
})();
    
