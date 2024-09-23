//Suma de promedios con arrays
exports.sumAverages = (...avgArrays) => {
  const summedAverages = {};

  avgArrays.forEach((avgArray) => {
    avgArray.forEach((obj) => {
      const key = Object.keys(obj)[0];
      const value = obj[key];
      summedAverages[key] = (summedAverages[key] || 0) + value;
    });
  });

  // Convertir el objeto de resultados de nuevo a un array
  return Object.entries(summedAverages).map(([key, value]) => ({
    [key]: value,
  }));
};
