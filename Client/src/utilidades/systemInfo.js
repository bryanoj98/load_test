const os = require("os");

exports.getCpuUsage = () => {
  const cpus = os.cpus();

  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b, 0),
    0,
  );

  const totalUsed = totalTick - totalIdle;
  const usage = (totalUsed / totalTick) * 100;

  return usage.toFixed(2); // Retorna el uso de CPU con 2 decimales
};
