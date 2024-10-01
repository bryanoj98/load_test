exports.addPartialValues = (var1, var2) => {
  const acumulador = {};

  const sumarElemento = (element) => {
    const clave = Object.keys(element)[0];
    if (!acumulador[clave]) {
      acumulador[clave] = { sumLatencias: 0, numMuestras: 0 };
    }
    acumulador[clave].sumLatencias += element[clave].sumLatencias;
    acumulador[clave].numMuestras += element[clave].numMuestras;
  };

  // Sumar elementos de variable1
  var1.forEach(sumarElemento);
  // Sumar elementos de variable2
  var2.forEach(sumarElemento);

  // Convertir el acumulador de objeto a array
  return Object.keys(acumulador).map((clave) => ({
    [clave]: acumulador[clave],
  }));
};

exports.calculateAverages = (resultado) => {
  return resultado.map((element) => {
    const clave = Object.keys(element)[0];
    const { sumLatencias, numMuestras } = element[clave];

    return {
      [clave]: sumLatencias / numMuestras,
    };
  });
};

//Si es descendente
// Ordenar el array en orden descendente según la clave
// latenciaAVG = latenciaAVG.sort((a, b) => {
//   const claveA = parseInt(Object.keys(a)[0], 10); // Convertir a número
//   const claveB = parseInt(Object.keys(b)[0], 10); // Convertir a número

//   return claveB - claveA; // Descendente
// });
