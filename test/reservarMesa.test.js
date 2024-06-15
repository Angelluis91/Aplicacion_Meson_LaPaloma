const { reservarMesa } = require('../index');
const httpMocks = require('node-mocks-http');
const { Pool } = require('pg');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mPool),
  };
});

describe('reservarMesa', () => {
  let req, res, pool;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    pool = new Pool(); // Inicializa el mock del Pool
    pool.query.mockClear(); // Asegúrate de que el mock esté limpio antes de cada prueba
  });

  it('debería devolver error 400 si hay datos faltantes', async () => {
    req.body = {
      nombre: '',
      telefono: '123456789',
      email: 'test@example.com',
      fecha: '2024-06-15',
      hora: '15:30',
      personas: '2'
    };

    await reservarMesa(req, res);

    expect(res.statusCode).toBe(302); // Código de redirección
    expect(res._getRedirectUrl()).toBe('/reserva_erronea.html');
  });

  it('debería devolver error 400 si la mesa no está disponible', async () => {
    req.body = {
      nombre: 'John Doe',
      telefono: '123456789',
      email: 'john@example.com',
      fecha: '2024-06-15',
      hora: '15:30',
      personas: '2'
    };

    pool.query.mockResolvedValueOnce({ rows: [] });

    await reservarMesa(req, res);

    expect(res.statusCode).toBe(302); // Código de redirección
    expect(res._getRedirectUrl()).toBe('/reserva_erronea.html');
  });

  it('debería reservar la mesa exitosamente', async () => {
    req.body = {
      nombre: 'John Doe',
      telefono: '123456789',
      email: 'john@example.com',
      fecha: '2024-06-15',
      hora: '15:30',
      personas: '2'
    };

    pool.query
      .mockResolvedValueOnce({ rows: [{ mesa_id: '1' }] }) // Mesa disponible
      .mockResolvedValueOnce({ rows: [{ cliente_id: '1' }] }) // Cliente existente
      .mockResolvedValueOnce({ rows: [{ reserva_id: '1' }] }); // Reserva exitosa

    await reservarMesa(req, res);

    expect(res.statusCode).toBe(302); // Código de redirección
    expect(res._getRedirectUrl()).toBe('/reserva_exitosa.html');
  });
});
