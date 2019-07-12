
/* CALLBACKS */
// Funciones que se ejecuta cuando existe un cambio en el valor del input
// Se les pasa como parámetro el nuevo valor en string.

function calcularCambio(nuevoValorEnInput)
{
    console.log('Calculando cambio - valor: ' + nuevoValorEnInput );
}

function imprimirPantalla(nuevoValorEnInput)
{
    console.log('imprimiendo en pantalla - valor: ' + nuevoValorEnInput);
}

/* Asignación de máscara, utiliza eventos input y keyDown */
MASCARA_CONTABLE.setMascara("myInput", imprimirPantalla)
MASCARA_CONTABLE.setMascara("myOtherInput", calcularCambio, "10.00")



/* Para resetear un elemento a su valor inicial(cuando se le aplicó la máscara) */

// Resetea a 0.0.
MASCARA_CONTABLE.clearElemento('myInput');
// Resetea a 10.00
MASCARA_CONTABLE.clearElemento('myOtherInput');

/* Para resetear un elemento a un nuevo valor inicial */

// Resetea a 10.0.
MASCARA_CONTABLE.clearElemento('myInput','10.00');
// Resetea a 0.00
MASCARA_CONTABLE.clearElemento('myOtherInput', '0.00');


document.getElementById('myInput').focus();
