var MASCARA_CONTABLE = (function(){
    var _elementos =[];
    var _keyPressedCode;
    var _datoIngresadoValido = false;

    function setMascaraContabilidad(idElemento, funcionCallBack, valorInicial){
        var elemento = document.getElementById(idElemento);
        elemento.value = valorInicial || "0.00";
        elemento.oldValue = elemento.value;

        // Agregar elemento con su callback a las variables
        _elementos.push({idElemento:idElemento, funcionCallBack: funcionCallBack});

        elemento.addEventListener('input',aplicarFormato);
        elemento.addEventListener('keydown',setCodigoTecla);        
    }

    function aplicarFormato(event){
        // Elemento
        var inputElement = event.target;
        var strMonto = inputElement.value;
        var strMontoSinComas = null;

        // Posición del cursor
        var posicionCursor = inputElement.selectionStart;
        var posicionCursorDerechaIzquierda = inputElement.value.length - posicionCursor;
        var posicionCursorFinal = null;

        //
        var numeroModificaciones = inputElement.value.length - aplicarFormatoMoneda(inputElement.oldValue).length;
        numeroModificaciones = numeroModificaciones < 0 ? numeroModificaciones*-1 : numeroModificaciones;

        // Si no se ingresó un dato válido regresa el valor anterior (no permite el cambio)
        if(!_datoIngresadoValido ||  numeroModificaciones > 1 ){
            inputElement.value = aplicarFormatoMoneda(inputElement.oldValue);

            posicionCursorFinal = posicionCursor -1;
            posicionCursorFinal = posicionCursorFinal < 0 ? 0 : posicionCursorFinal;
            setCaretPosicion(inputElement.id, posicionCursorFinal);
            return;
        }

        // Variables relacionadas con la tecla presionada
        var btnDelete = _keyPressedCode === 8;
        var btnSuprimir = _keyPressedCode == 46;
        var seBorroUnDato = btnDelete || btnSuprimir;

        //Se ingresó un número
        if(!seBorroUnDato){

            //Limpiar comas
            strMontoSinComas = borrarCaracter(strMonto,',');

            // Modificación en la parte decimal o entera
            var posicionPunto = strMonto.indexOf('.');
            var seModificoParteDecimal = posicionPunto < posicionCursor;

            if(seModificoParteDecimal){
                strMontoSinComas = recorrerPuntoDecimalDerecha(strMontoSinComas);
            }

            // Menor a diez millones
            if(!(parseInt(strMontoSinComas)<10000000)){
                inputElement.value = aplicarFormatoMoneda(inputElement.oldValue);
                return;
            }
        }
        else{

            // Si se borró una coma o un punto
            var seBorroPunto = !strMonto.includes('.');
            var intNumeroComasAnteriores = obtenerNumeroCaracteresPresentes(aplicarFormatoMoneda(inputElement.oldValue),',');
            var intNumeroComasActuales = obtenerNumeroCaracteresPresentes(strMonto, ',');
            var seBorroComa = intNumeroComasAnteriores>intNumeroComasActuales;
 

            if(seBorroComa || seBorroPunto){
                
                // Caracter unión
                var caracterJoin = seBorroPunto ? '.':',';

                // Si delete => quitar elemento a la izquierda del cursor
                if(btnDelete){
                    strMonto = replaceElementoIzquierda(strMonto,posicionCursor,caracterJoin);
                }
                else{
                    strMonto = replaceElementoDerecha(strMonto,posicionCursor,caracterJoin);
                }

                // Limpia las comas
                strMontoSinComas = borrarCaracter(strMonto,',');

            }
            else{
                // Se borró un número
                var posicionPunto = strMonto.indexOf('.');
                var seModificoParteDecimal = posicionCursor > posicionPunto;
            }

        }

        // Asigna valores
        inputElement.oldValue = strMontoSinComas;
        inputElement.value = aplicarFormatoMoneda(strMontoSinComas);

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
            }else{
                posicionCursorFinal--;
            }
            posicionCursorFinal = posicionCursorFinal < 0 ? 0 : posicionCursorFinal;
        }
            
        else 
            posicionCursorFinal : posicionCursor;

        // Notifica a la función call back
        var callback = obtenerFuncionCallBackDelElemento(inputElement.id);
        if(callback){
            callback(strMontoSinComas);
        }

        // Posición del cursor
        setCaretPosicion(inputElement.id, posicionCursorFinal);
    }

    function setCodigoTecla(event){
        _keyPressedCode = event.which || event.keyCode;

        _datoIngresadoValido =
         _keyPressedCode === 8
         || _keyPressedCode ===46
         || _keyPressedCode >=48 && _keyPressedCode<=57 || _keyPressedCode>=96 && _keyPressedCode<=105;
    }


    function obtenerFuncionCallBackDelElemento(idElemento){
        for (var i = 0; i < _elementos.length; i++) {
            var elemento = _elementos[i];
            if(idElemento === elemento.idElemento){
                return elemento.funcionCallBack;
            }
        }
        return null;
    }

    function borrarCaracter(valor, caracter){
        if(!caracter || !valor)
            return valor;

        while(valor.includes(caracter)){
            valor = valor.replace(caracter,'');
        }

        return valor;
    }

    function obtenerNumeroCaracteresPresentes(valor, caracter){
        var numeroComas = 0;
        for (var i = 0; i < valor.length; i++) {
            if(valor[i]!== caracter)
                continue;
            numeroComas ++;
        }
        return numeroComas;
    }

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

    function setCaretPosicion(idElemento,caretPos){
        var elem = document.getElementById(idElemento);

        if(elem != null){
            if(elem.createTextRange){
                var range = elem.createTextRange();
                range.move('character', caretPos);
                range.select();
            }
            else{
                if(elem.selectionStart){
                    elem.focus();
                    elem.setSelectionRange(caretPos,caretPos);
                }
                else
                    elem.focus();
            }
        }
    }

    function recorrerPuntoDecimalIzquierda(valor){
        var strParteIzquierda = valor.split('.')[0];
        var strParteDerecha = valor.split('.')[1];
        
        strParteDerecha = strParteIzquierda[strParteIzquierda.length-1]+strParteDerecha;
        strParteIzquierda = strParteIzquierda.substring(0,strParteIzquierda.length-1);

        strParteIzquierda = strParteIzquierda || '0';
        strParteDerecha = strParteDerecha || '0';

        return strParteIzquierda + '.' + strParteDerecha;
    }

    function recorrerPuntoDecimalDerecha(valor){
        var strParteIzquierda = valor.split('.')[0];
        var strParteDerecha = valor.split('.')[1];
        
        strParteIzquierda = strParteIzquierda + strParteDerecha[0];
        strParteDerecha = strParteDerecha.substring(1);

        strParteIzquierda = strParteIzquierda || '0';
        strParteDerecha = strParteDerecha || '0';

        return strParteIzquierda + '.' + strParteDerecha;
    }

    function replaceElementoIzquierda(valor, indice, caracterUnion){
        caracterUnion = caracterUnion || '';
        var strPrimeraParte = valor.substring(0,indice);
        var strSegundaParte = valor.substring(indice,valor.length);
        
        return strPrimeraParte.substring(0, strPrimeraParte.length-1) + caracterUnion + strSegundaParte;
    }

    function replaceElementoDerecha(valor, indice, caracterUnion){
        caracterUnion = caracterUnion || '';
        var strPrimeraParte = valor.substring(0,indice);
        var strSegundaParte = valor.substring(indice,valor.length);
        
        return strPrimeraParte + caracterUnion + strSegundaParte.substring(1,strSegundaParte.length);
    }

    return {
        setMascara: setMascaraContabilidad
    }
})();
    
