exports.filterData = (cpuMemoryUsage) => {

    // Filtrar objetos con averagePayloadSize = 0
    const filteredData = cpuMemoryUsage.filter(item => item.averagePayloadSize !== 0);
  
    // Función para promediar objetos con el mismo nOfThreads y averagePayloadSize
    const averagedData = filteredData.reduce((acc, item) => {
      const key = `${item.nOfThreads}-${item.averagePayloadSize}`;
  
      if (!acc[key]) {
        acc[key] = {
          ...item,
          count: 1
        };
      } else {
        acc[key].cpu = (parseFloat(acc[key].cpu) + parseFloat(item.cpu)).toString();
        acc[key].memory.rss += item.memory.rss;
        acc[key].count += 1;
      }
  
      return acc;
    }, {});
  
    // Calcular el promedio
    const result = Object.values(averagedData).map(item => {
      const averageCpu = (parseFloat(item.cpu) / item.count).toFixed(2);
      return {
        ...item,
        cpu: averageCpu,
        memory: { rss: Math.round(item.memory.rss / item.count) }, // Promediar rss
        count: undefined // eliminar el conteo del resultado final
      };
    });
  
    // cpuMemoryUsage = result;
    return result;
  };