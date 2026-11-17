--
-- PostgreSQL database dump
--

\restrict ZIzRENAU2vgN4btsLA09hvZUKXzdc8T6s8iv90Xkv44g7YWLt3Uklg0n22jTwEx

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: TipoProducto; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."TipoProducto" AS ENUM (
    'producto',
    'promo',
    'combo'
);


ALTER TYPE public."TipoProducto" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Categoria; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Categoria" (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    orden integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    activa boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Categoria" OWNER TO admin;

--
-- Name: Categoria_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Categoria_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Categoria_id_seq" OWNER TO admin;

--
-- Name: Categoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Categoria_id_seq" OWNED BY public."Categoria".id;


--
-- Name: DetallePedido; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."DetallePedido" (
    id integer NOT NULL,
    "pedidoId" integer NOT NULL,
    "productoId" integer NOT NULL,
    cantidad integer NOT NULL,
    "precioUnitario" numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "varianteId" integer,
    personalizacion jsonb
);


ALTER TABLE public."DetallePedido" OWNER TO admin;

--
-- Name: DetallePedido_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."DetallePedido_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DetallePedido_id_seq" OWNER TO admin;

--
-- Name: DetallePedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."DetallePedido_id_seq" OWNED BY public."DetallePedido".id;


--
-- Name: Inventario; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Inventario" (
    id integer NOT NULL,
    "productoId" integer NOT NULL,
    stock_actual integer NOT NULL,
    stock_minimo integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "Inventario_stock_actual_check" CHECK ((stock_actual >= 0)),
    CONSTRAINT "Inventario_stock_minimo_check" CHECK ((stock_minimo >= 0))
);


ALTER TABLE public."Inventario" OWNER TO admin;

--
-- Name: Inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Inventario_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Inventario_id_seq" OWNER TO admin;

--
-- Name: Inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Inventario_id_seq" OWNED BY public."Inventario".id;


--
-- Name: Pedido; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Pedido" (
    id integer NOT NULL,
    total numeric(10,2) NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    "metodoPago" text NOT NULL,
    "clienteNombre" text,
    observacion text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "turnoId" integer,
    idempotency_key character varying(36),
    CONSTRAINT "Pedido_estado_check" CHECK ((estado = ANY (ARRAY['pendiente'::text, 'en_preparacion'::text, 'listo'::text, 'entregado'::text, 'cancelado'::text]))),
    CONSTRAINT "Pedido_metodo_pago_check" CHECK (("metodoPago" = ANY (ARRAY['efectivo'::text, 'tarjeta'::text, 'transferencia'::text]))),
    CONSTRAINT "Pedido_total_check" CHECK ((total >= (0)::numeric))
);


ALTER TABLE public."Pedido" OWNER TO admin;

--
-- Name: Pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Pedido_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Pedido_id_seq" OWNER TO admin;

--
-- Name: Pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Pedido_id_seq" OWNED BY public."Pedido".id;


--
-- Name: Producto; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Producto" (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL,
    precio_original numeric(10,2),
    descuento_porcentaje integer,
    disponible boolean DEFAULT true NOT NULL,
    destacado boolean DEFAULT false NOT NULL,
    promocion boolean DEFAULT false NOT NULL,
    tipo public."TipoProducto" DEFAULT 'producto'::public."TipoProducto" NOT NULL,
    controla_stock boolean DEFAULT true NOT NULL,
    imagen_url text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "Producto_precio_check" CHECK ((precio >= (0)::numeric))
);


ALTER TABLE public."Producto" OWNER TO admin;

--
-- Name: Producto_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Producto_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Producto_id_seq" OWNER TO admin;

--
-- Name: Producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Producto_id_seq" OWNED BY public."Producto".id;


--
-- Name: Turno; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Turno" (
    id integer NOT NULL,
    "usuarioId" integer NOT NULL,
    estado text DEFAULT 'abierto'::text NOT NULL,
    "fechaInicio" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "fechaCierre" timestamp(3) without time zone,
    resumen jsonb,
    CONSTRAINT "Turno_estado_check" CHECK ((estado = ANY (ARRAY['abierto'::text, 'cerrado'::text])))
);


ALTER TABLE public."Turno" OWNER TO admin;

--
-- Name: Turno_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Turno_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Turno_id_seq" OWNER TO admin;

--
-- Name: Turno_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Turno_id_seq" OWNED BY public."Turno".id;


--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Usuario" (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role text NOT NULL,
    label text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "Usuario_role_check" CHECK ((role = ANY (ARRAY['cajero'::text, 'cocina'::text, 'admin'::text])))
);


ALTER TABLE public."Usuario" OWNER TO admin;

--
-- Name: Usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Usuario_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Usuario_id_seq" OWNER TO admin;

--
-- Name: Usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Usuario_id_seq" OWNED BY public."Usuario".id;


--
-- Name: Variante; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Variante" (
    id integer NOT NULL,
    "productoId" integer NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    orden integer DEFAULT 0 NOT NULL,
    disponible boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Variante" OWNER TO admin;

--
-- Name: Variante_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Variante_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Variante_id_seq" OWNER TO admin;

--
-- Name: Variante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Variante_id_seq" OWNED BY public."Variante".id;


--
-- Name: _CategoriaToProducto; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."_CategoriaToProducto" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_CategoriaToProducto" OWNER TO admin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- Name: pedido_historial; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.pedido_historial (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    usuario_id integer,
    accion text NOT NULL,
    cambios jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.pedido_historial OWNER TO admin;

--
-- Name: pedido_historial_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.pedido_historial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedido_historial_id_seq OWNER TO admin;

--
-- Name: pedido_historial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.pedido_historial_id_seq OWNED BY public.pedido_historial.id;


--
-- Name: producto_componentes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.producto_componentes (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    componente_id integer NOT NULL,
    cantidad integer NOT NULL,
    variante_id integer,
    CONSTRAINT producto_componentes_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.producto_componentes OWNER TO admin;

--
-- Name: producto_componentes_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.producto_componentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.producto_componentes_id_seq OWNER TO admin;

--
-- Name: producto_componentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.producto_componentes_id_seq OWNED BY public.producto_componentes.id;


--
-- Name: Categoria id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Categoria" ALTER COLUMN id SET DEFAULT nextval('public."Categoria_id_seq"'::regclass);


--
-- Name: DetallePedido id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DetallePedido" ALTER COLUMN id SET DEFAULT nextval('public."DetallePedido_id_seq"'::regclass);


--
-- Name: Inventario id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inventario" ALTER COLUMN id SET DEFAULT nextval('public."Inventario_id_seq"'::regclass);


--
-- Name: Pedido id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Pedido" ALTER COLUMN id SET DEFAULT nextval('public."Pedido_id_seq"'::regclass);


--
-- Name: Producto id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Producto" ALTER COLUMN id SET DEFAULT nextval('public."Producto_id_seq"'::regclass);


--
-- Name: Turno id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Turno" ALTER COLUMN id SET DEFAULT nextval('public."Turno_id_seq"'::regclass);


--
-- Name: Usuario id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Usuario" ALTER COLUMN id SET DEFAULT nextval('public."Usuario_id_seq"'::regclass);


--
-- Name: Variante id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Variante" ALTER COLUMN id SET DEFAULT nextval('public."Variante_id_seq"'::regclass);


--
-- Name: pedido_historial id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pedido_historial ALTER COLUMN id SET DEFAULT nextval('public.pedido_historial_id_seq'::regclass);


--
-- Name: producto_componentes id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.producto_componentes ALTER COLUMN id SET DEFAULT nextval('public.producto_componentes_id_seq'::regclass);


--
-- Data for Name: Categoria; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Categoria" (id, nombre, descripcion, orden, "createdAt", "updatedAt", activa) FROM stdin;
1	Ahorros exclusivos	Productos con ahorro exclusivo publicados en la tienda.	2	2026-10-27 15:42:04.553	2026-10-27 15:42:04.553	t
2	Promociones	Promociones activas del menú.	3	2026-10-27 15:42:04.553	2026-10-27 15:42:04.553	t
3	Completos	Todos los completos disponibles en el menú.	4	2026-10-27 15:42:04.553	2026-10-27 15:42:04.553	t
4	Sandwich	Sandwiches disponibles en el menú.	5	2026-10-27 15:42:04.553	2026-10-27 15:42:04.553	t
5	Sushi	Productos de Sushi	0	2026-10-28 01:46:28.879	2026-10-28 15:16:08.926	f
\.


--
-- Data for Name: DetallePedido; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."DetallePedido" (id, "pedidoId", "productoId", cantidad, "precioUnitario", subtotal, "varianteId", personalizacion) FROM stdin;
1	1	1	3	3900.00	11700.00	\N	\N
2	2	1	1	3900.00	3900.00	\N	\N
3	2	1	1	3900.00	3900.00	\N	\N
4	3	1	1	3900.00	3900.00	\N	\N
5	3	2	1	8300.00	8300.00	\N	\N
6	3	2	1	8300.00	8300.00	\N	\N
7	4	1	1	3900.00	3900.00	\N	\N
8	5	2	1	8300.00	8300.00	\N	\N
9	5	2	1	8300.00	8300.00	\N	\N
10	6	2	1	8300.00	8300.00	\N	\N
11	6	3	1	7820.00	7820.00	\N	\N
12	6	5	2	5500.00	11000.00	4	\N
13	7	2	1	8300.00	8300.00	\N	\N
14	8	3	2	7820.00	15640.00	\N	\N
15	8	10	1	3500.00	3500.00	5	\N
16	9	3	1	7820.00	7820.00	\N	\N
17	9	1	1	3900.00	3900.00	\N	\N
18	9	1	1	3900.00	3900.00	\N	\N
19	10	4	1	10500.00	10500.00	\N	\N
20	11	1	1	3900.00	3900.00	\N	\N
21	11	1	3	3900.00	11700.00	\N	\N
22	12	1	1	3900.00	3900.00	\N	\N
23	12	1	1	3900.00	3900.00	\N	\N
24	12	2	1	8300.00	8300.00	\N	\N
25	13	1	1	3900.00	3900.00	\N	\N
26	13	2	1	8300.00	8300.00	\N	\N
27	14	1	1	3900.00	3900.00	\N	\N
28	14	2	2	8300.00	16600.00	\N	\N
29	14	3	1	7820.00	7820.00	\N	\N
30	15	2	2	8300.00	16600.00	\N	\N
31	16	2	1	8300.00	8300.00	\N	\N
32	16	3	1	7820.00	7820.00	\N	\N
33	17	2	1	8300.00	8300.00	\N	\N
34	17	3	1	7820.00	7820.00	\N	\N
35	17	1	1	3900.00	3900.00	\N	\N
36	18	3	3	7820.00	23460.00	\N	\N
37	19	3	1	7820.00	7820.00	\N	\N
38	19	1	1	3900.00	3900.00	\N	\N
39	20	8	1	2900.00	2900.00	\N	\N
40	20	1	1	3900.00	3900.00	\N	\N
41	20	1	2	3900.00	7800.00	\N	\N
42	21	1	1	3900.00	3900.00	\N	\N
43	22	1	2	3900.00	7800.00	\N	\N
44	22	1	1	3900.00	3900.00	\N	\N
45	23	1	1	3900.00	3900.00	\N	\N
46	23	2	1	8300.00	8300.00	\N	\N
47	23	2	1	8300.00	8300.00	\N	\N
48	24	1	1	3900.00	3900.00	\N	\N
49	25	2	1	8300.00	8300.00	\N	\N
50	25	2	1	8300.00	8300.00	\N	\N
51	26	2	1	8300.00	8300.00	\N	\N
52	26	3	1	7820.00	7820.00	\N	\N
53	26	9	1	3900.00	3900.00	\N	\N
54	27	2	1	8300.00	8300.00	\N	\N
55	28	3	1	7820.00	7820.00	\N	\N
56	28	5	3	5500.00	16500.00	1	\N
57	28	1	1	3900.00	3900.00	\N	\N
58	29	3	2	7820.00	15640.00	\N	\N
59	30	10	1	3500.00	3500.00	6	\N
60	30	1	1	3900.00	3900.00	\N	\N
61	31	1	1	3900.00	3900.00	\N	\N
62	31	1	1	3900.00	3900.00	\N	\N
63	31	2	1	8300.00	8300.00	\N	\N
64	32	1	1	3900.00	3900.00	\N	\N
65	33	1	1	3900.00	3900.00	\N	\N
66	33	2	1	8300.00	8300.00	\N	\N
67	34	1	1	3900.00	3900.00	\N	\N
68	34	2	1	8300.00	8300.00	\N	\N
69	34	3	2	7820.00	15640.00	\N	\N
70	35	2	3	8300.00	24900.00	\N	\N
71	36	2	2	8300.00	16600.00	\N	\N
72	36	3	1	7820.00	7820.00	\N	\N
73	37	2	1	8300.00	8300.00	\N	\N
74	38	3	1	7820.00	7820.00	\N	\N
75	38	6	1	5500.00	5500.00	\N	\N
76	39	3	1	7820.00	7820.00	\N	\N
77	39	1	1	3900.00	3900.00	\N	\N
78	39	1	1	3900.00	3900.00	\N	\N
79	40	7	1	5000.00	5000.00	\N	\N
80	41	1	1	3900.00	3900.00	\N	\N
81	41	1	1	3900.00	3900.00	\N	\N
82	42	1	1	3900.00	3900.00	\N	\N
83	42	1	2	3900.00	7800.00	\N	\N
84	42	2	1	8300.00	8300.00	\N	\N
85	43	1	2	3900.00	7800.00	\N	\N
86	44	1	1	3900.00	3900.00	\N	\N
87	44	2	1	8300.00	8300.00	\N	\N
88	45	2	1	8300.00	8300.00	\N	\N
89	45	2	3	8300.00	24900.00	\N	\N
90	45	3	1	7820.00	7820.00	\N	\N
91	46	2	1	8300.00	8300.00	\N	\N
92	47	2	1	8300.00	8300.00	\N	\N
93	47	3	1	7820.00	7820.00	\N	\N
94	48	3	1	7820.00	7820.00	\N	\N
95	48	9	1	3900.00	3900.00	\N	\N
96	48	1	2	3900.00	7800.00	\N	\N
97	49	3	1	7820.00	7820.00	\N	\N
98	50	5	2	5500.00	11000.00	2	\N
99	50	1	1	3900.00	3900.00	\N	\N
100	51	1	1	3900.00	3900.00	\N	\N
101	51	1	1	3900.00	3900.00	\N	\N
102	51	2	1	8300.00	8300.00	\N	\N
103	52	1	3	3900.00	11700.00	\N	\N
104	53	1	1	3900.00	3900.00	\N	\N
105	53	2	1	8300.00	8300.00	\N	\N
106	54	1	1	3900.00	3900.00	\N	\N
107	54	2	1	8300.00	8300.00	\N	\N
108	54	3	1	7820.00	7820.00	\N	\N
109	55	2	1	8300.00	8300.00	\N	\N
110	55	2	1	8300.00	8300.00	\N	\N
111	56	2	1	8300.00	8300.00	\N	\N
112	56	3	2	7820.00	15640.00	\N	\N
113	56	10	1	3500.00	3500.00	6	\N
114	57	2	2	8300.00	16600.00	\N	\N
115	58	3	1	7820.00	7820.00	\N	\N
116	58	4	1	10500.00	10500.00	\N	\N
117	59	3	1	7820.00	7820.00	\N	\N
118	59	1	1	3900.00	3900.00	\N	\N
119	59	1	1	3900.00	3900.00	\N	\N
120	60	6	1	5500.00	5500.00	\N	\N
121	61	1	1	3900.00	3900.00	\N	\N
122	61	1	1	3900.00	3900.00	\N	\N
123	62	1	1	3900.00	3900.00	\N	\N
124	62	1	3	3900.00	11700.00	\N	\N
125	62	2	2	8300.00	16600.00	\N	\N
126	63	1	1	3900.00	3900.00	\N	\N
127	64	1	2	3900.00	7800.00	\N	\N
128	64	2	1	8300.00	8300.00	\N	\N
129	65	2	1	8300.00	8300.00	\N	\N
130	65	2	1	8300.00	8300.00	\N	\N
131	65	3	1	7820.00	7820.00	\N	\N
132	66	2	1	8300.00	8300.00	\N	\N
133	66	3	1	7820.00	7820.00	\N	\N
134	67	2	1	8300.00	8300.00	\N	\N
135	67	3	1	7820.00	7820.00	\N	\N
136	67	1	1	3900.00	3900.00	\N	\N
137	68	3	1	7820.00	7820.00	\N	\N
138	69	3	3	7820.00	23460.00	\N	\N
139	69	1	1	3900.00	3900.00	\N	\N
140	70	9	1	3900.00	3900.00	\N	\N
141	70	1	2	3900.00	7800.00	\N	\N
142	70	1	1	3900.00	3900.00	\N	\N
143	71	1	2	3900.00	7800.00	\N	\N
144	72	1	1	3900.00	3900.00	\N	\N
145	72	1	1	3900.00	3900.00	\N	\N
146	73	1	1	3900.00	3900.00	\N	\N
147	73	2	1	8300.00	8300.00	\N	\N
148	73	2	1	8300.00	8300.00	\N	\N
149	74	1	1	3900.00	3900.00	\N	\N
150	75	2	1	8300.00	8300.00	\N	\N
151	75	2	1	8300.00	8300.00	\N	\N
152	76	2	1	8300.00	8300.00	\N	\N
153	76	3	1	7820.00	7820.00	\N	\N
154	76	5	2	5500.00	11000.00	2	\N
155	77	2	1	8300.00	8300.00	\N	\N
156	78	3	2	7820.00	15640.00	\N	\N
157	78	10	1	3500.00	3500.00	5	\N
158	79	3	1	7820.00	7820.00	\N	\N
159	79	1	3	3900.00	11700.00	\N	\N
160	79	1	1	3900.00	3900.00	\N	\N
161	80	4	1	10500.00	10500.00	\N	\N
162	80	1	1	3900.00	3900.00	\N	\N
163	81	1	1	3900.00	3900.00	\N	\N
164	81	1	1	3900.00	3900.00	\N	\N
165	81	2	1	8300.00	8300.00	\N	\N
166	82	1	1	3900.00	3900.00	\N	\N
167	83	1	1	3900.00	3900.00	\N	\N
168	83	2	1	8300.00	8300.00	\N	\N
169	84	1	1	3900.00	3900.00	\N	\N
170	84	2	2	8300.00	16600.00	\N	\N
171	84	3	1	7820.00	7820.00	\N	\N
172	85	2	2	8300.00	16600.00	\N	\N
173	86	2	3	8300.00	24900.00	\N	\N
174	86	3	1	7820.00	7820.00	\N	\N
175	87	2	1	8300.00	8300.00	\N	\N
176	87	3	1	7820.00	7820.00	\N	\N
177	87	1	1	3900.00	3900.00	\N	\N
178	88	3	1	7820.00	7820.00	\N	\N
179	89	3	1	7820.00	7820.00	\N	\N
180	89	1	1	3900.00	3900.00	\N	\N
181	90	8	1	2900.00	2900.00	\N	\N
182	90	1	1	3900.00	3900.00	\N	\N
183	90	1	2	3900.00	7800.00	\N	\N
184	91	1	1	3900.00	3900.00	\N	\N
185	92	1	2	3900.00	7800.00	\N	\N
186	92	1	1	3900.00	3900.00	\N	\N
187	93	1	1	3900.00	3900.00	\N	\N
188	93	2	1	8300.00	8300.00	\N	\N
189	93	2	1	8300.00	8300.00	\N	\N
190	94	1	1	3900.00	3900.00	\N	\N
191	95	2	1	8300.00	8300.00	\N	\N
192	95	2	1	8300.00	8300.00	\N	\N
193	96	4	1	10500.00	10500.00	\N	{"aderezos": ["Mayonesa", "Ketchup"]}
194	96	1	1	3900.00	3900.00	\N	{"aderezos": ["Mostaza", "Mayonesa"]}
195	97	10	1	3500.00	3500.00	5	{"aderezos": [], "comentario": "cebolla"}
196	98	5	1	5500.00	5500.00	\N	{"aderezos": ["Mostaza"]}
197	98	3	1	7820.00	7820.00	\N	{"aderezos": ["Ketchup"], "comentario": "sdasd"}
199	99	3	1	7820.00	7820.00	\N	{"aderezos": ["Ketchup"]}
200	100	3	1	7820.00	7820.00	\N	{"aderezos": ["Mayonesa"]}
201	101	5	1	5500.00	5500.00	\N	\N
202	102	5	1	5500.00	5500.00	\N	\N
203	103	11	1	3900.00	3900.00	\N	{"aderezos": []}
204	104	5	1	5500.00	5500.00	\N	\N
205	105	5	1	5500.00	5500.00	\N	\N
206	106	6	1	5500.00	5500.00	\N	\N
207	107	6	1	5500.00	5500.00	\N	\N
208	108	11	1	3900.00	3900.00	\N	{"aderezos": []}
209	109	8	1	2900.00	2900.00	\N	\N
210	110	8	1	2900.00	2900.00	\N	\N
211	111	8	1	2900.00	2900.00	\N	\N
212	112	8	1	2900.00	2900.00	\N	\N
213	113	8	1	2900.00	2900.00	\N	\N
214	114	8	1	2900.00	2900.00	\N	\N
215	115	8	1	2900.00	2900.00	\N	\N
216	116	11	1	3900.00	3900.00	\N	{"aderezos": []}
217	117	8	1	2900.00	2900.00	\N	\N
218	118	8	1	2900.00	2900.00	\N	\N
219	119	11	1	3900.00	3900.00	\N	{"aderezos": []}
220	120	8	1	2900.00	2900.00	\N	\N
221	121	8	1	2900.00	2900.00	\N	\N
222	122	8	1	2900.00	2900.00	\N	{"aderezos": ["Poca mayo"]}
223	123	2	1	8300.00	8300.00	\N	{"aderezos": ["Mostaza", "Mayonesa"]}
224	124	2	1	8300.00	8300.00	\N	{"aderezos": ["Mayonesa"]}
225	125	8	1	2900.00	2900.00	\N	{"aderezos": ["Ketchup"]}
226	126	8	1	2900.00	2900.00	\N	{"aderezos": ["Mayonesa"]}
227	127	1	1	3900.00	3900.00	\N	{"aderezos": ["Poca mayo"]}
228	127	1	1	3900.00	3900.00	\N	{"aderezos": ["Mayonesa"]}
229	128	3	1	7820.00	7820.00	\N	{"aderezos": ["Ketchup"]}
230	129	2	1	8300.00	8300.00	\N	{"aderezos": ["Mayonesa"]}
231	130	10	1	3500.00	3500.00	6	{"aderezos": []}
232	131	1	1	3900.00	3900.00	\N	{"aderezos": ["Mostaza"]}
233	132	1	1	3900.00	3900.00	\N	{"aderezos": ["Mostaza", "Mayonesa"], "comentario": "cebolla"}
234	133	13	1	5000.00	5000.00	\N	{"aderezos": []}
235	134	8	1	2900.00	2900.00	\N	\N
236	135	8	1	2900.00	2900.00	\N	\N
237	136	8	1	2900.00	2900.00	\N	\N
238	137	8	1	2900.00	2900.00	\N	\N
239	138	11	1	3900.00	3900.00	\N	{"aderezos": []}
240	139	8	1	2900.00	2900.00	\N	\N
241	140	8	1	2900.00	2900.00	\N	\N
242	141	8	1	2900.00	2900.00	\N	\N
243	142	8	1	2900.00	2900.00	\N	\N
244	143	11	1	3900.00	3900.00	\N	{"aderezos": []}
245	144	9	1	3900.00	3900.00	\N	{"aderezos": ["Mostaza"]}
\.


--
-- Data for Name: Inventario; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Inventario" (id, "productoId", stock_actual, stock_minimo, "createdAt", "updatedAt") FROM stdin;
8	12	50	10	2026-10-27 15:42:04.621	2026-10-27 15:42:04.621
3	7	0	10	2026-10-27 15:42:04.597	2026-10-27 15:42:27.271
1	5	0	10	2026-10-27 15:42:04.583	2026-10-28 00:03:44.413
2	6	0	10	2026-10-27 15:42:04.592	2026-10-28 00:05:03.535
6	10	48	10	2026-10-27 15:42:04.611	2026-10-28 00:48:34.491
9	13	59	100	2026-10-28 01:46:50.84	2026-10-28 01:48:16.371
4	8	24	10	2026-10-27 15:42:04.602	2026-10-28 02:20:28.952
7	11	44	10	2026-10-27 15:42:04.616	2026-10-28 02:20:31.794
5	9	49	10	2026-10-27 15:42:04.606	2026-10-28 15:03:00.025
\.


--
-- Data for Name: Pedido; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Pedido" (id, total, estado, "metodoPago", "clienteNombre", observacion, "createdAt", "updatedAt", "turnoId", idempotency_key) FROM stdin;
1	11700.00	cancelado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]:{"inventorySnapshot":[{"id":1,"stockActual":50,"stockMinimo":10,"seededStockActual":3,"seededStockMinimo":10},{"id":2,"stockActual":50,"stockMinimo":10,"seededStockActual":2,"seededStockMinimo":10},{"id":3,"stockActual":50,"stockMinimo":10,"seededStockActual":0,"seededStockMinimo":10}]}	2026-10-21 15:00:00	2026-10-21 15:00:00	1	\N
2	7800.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-21 23:17:00	2026-10-21 23:17:00	1	\N
3	20500.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 00:34:00	2026-10-22 00:34:00	1	\N
4	3900.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 01:21:00	2026-10-22 01:21:00	1	\N
5	16600.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-21 22:08:00	2026-10-21 22:08:00	1	\N
6	27120.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-21 17:25:00	2026-10-21 17:25:00	1	\N
7	8300.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 00:42:00	2026-10-22 00:42:00	1	\N
8	19140.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 01:29:00	2026-10-22 01:29:00	1	\N
9	15620.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-21 22:16:00	2026-10-21 22:16:00	1	\N
10	10500.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-21 23:33:00	2026-10-21 23:33:00	1	\N
11	15600.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-21 16:50:00	2026-10-21 16:50:00	1	\N
12	16100.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 01:07:00	2026-10-22 01:07:00	1	\N
13	12200.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 16:11:00	2026-10-22 16:11:00	2	\N
14	28320.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 00:28:00	2026-10-23 00:28:00	2	\N
15	16600.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 01:15:00	2026-10-23 01:15:00	2	\N
16	16120.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 22:02:00	2026-10-22 22:02:00	2	\N
17	20020.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 23:19:00	2026-10-22 23:19:00	2	\N
18	23460.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 15:36:00	2026-10-22 15:36:00	2	\N
19	11720.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 01:23:00	2026-10-23 01:23:00	2	\N
20	14600.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 22:10:00	2026-10-22 22:10:00	2	\N
21	3900.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 23:27:00	2026-10-22 23:27:00	2	\N
22	11700.00	cancelado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 00:44:00	2026-10-23 00:44:00	2	\N
23	20500.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 17:01:00	2026-10-22 17:01:00	2	\N
24	3900.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 22:18:00	2026-10-22 22:18:00	2	\N
25	16600.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-22 23:35:00	2026-10-22 23:35:00	2	\N
26	20020.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 00:52:00	2026-10-23 00:52:00	2	\N
27	8300.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 01:09:00	2026-10-23 01:09:00	2	\N
28	28220.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 17:22:00	2026-10-23 17:22:00	3	\N
29	15640.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 01:09:00	2026-10-24 01:09:00	3	\N
30	7400.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 22:56:00	2026-10-23 22:56:00	3	\N
31	16100.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 23:13:00	2026-10-23 23:13:00	3	\N
32	3900.00	cancelado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 00:30:00	2026-10-24 00:30:00	3	\N
33	12200.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 16:47:00	2026-10-23 16:47:00	3	\N
34	27840.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 22:04:00	2026-10-23 22:04:00	3	\N
35	24900.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-23 23:21:00	2026-10-23 23:21:00	3	\N
36	24420.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 00:38:00	2026-10-24 00:38:00	3	\N
37	8300.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 15:33:00	2026-10-24 15:33:00	4	\N
38	13320.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 22:50:00	2026-10-24 22:50:00	4	\N
39	15620.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 23:07:00	2026-10-24 23:07:00	4	\N
40	5000.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 00:24:00	2026-10-25 00:24:00	4	\N
41	7800.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 01:11:00	2026-10-25 01:11:00	4	\N
42	20000.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 17:58:00	2026-10-24 17:58:00	4	\N
43	7800.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 23:15:00	2026-10-24 23:15:00	4	\N
44	12200.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 00:32:00	2026-10-25 00:32:00	4	\N
45	41020.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 01:19:00	2026-10-25 01:19:00	4	\N
46	8300.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 22:06:00	2026-10-24 22:06:00	4	\N
47	16120.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 16:23:00	2026-10-24 16:23:00	4	\N
48	19520.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 00:40:00	2026-10-25 00:40:00	4	\N
49	7820.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 01:27:00	2026-10-25 01:27:00	4	\N
50	14900.00	cancelado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 22:14:00	2026-10-24 22:14:00	4	\N
51	16100.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 23:31:00	2026-10-24 23:31:00	4	\N
52	11700.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 15:48:00	2026-10-24 15:48:00	4	\N
53	12200.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 01:05:00	2026-10-25 01:05:00	4	\N
54	20020.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-24 22:22:00	2026-10-24 22:22:00	4	\N
55	16600.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 16:44:00	2026-10-25 16:44:00	5	\N
56	27440.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 23:01:00	2026-10-25 23:01:00	5	\N
57	16600.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 00:18:00	2026-10-26 00:18:00	5	\N
58	18320.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 01:05:00	2026-10-26 01:05:00	5	\N
59	15620.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 22:52:00	2026-10-25 22:52:00	5	\N
60	5500.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 15:09:00	2026-10-25 15:09:00	5	\N
61	7800.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 00:26:00	2026-10-26 00:26:00	5	\N
62	32200.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 01:13:00	2026-10-26 01:13:00	5	\N
63	3900.00	cancelado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 22:00:00	2026-10-25 22:00:00	5	\N
64	16100.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 23:17:00	2026-10-25 23:17:00	5	\N
65	24420.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-25 17:34:00	2026-10-25 17:34:00	5	\N
66	16120.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 17:55:00	2026-10-26 17:55:00	6	\N
67	20020.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 00:12:00	2026-10-27 00:12:00	6	\N
68	7820.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 01:29:00	2026-10-27 01:29:00	6	\N
69	27360.00	cancelado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 22:46:00	2026-10-26 22:46:00	6	\N
70	15600.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 23:03:00	2026-10-26 23:03:00	6	\N
71	7800.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 16:20:00	2026-10-26 16:20:00	6	\N
72	7800.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 01:07:00	2026-10-27 01:07:00	6	\N
73	20500.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 22:54:00	2026-10-26 22:54:00	6	\N
74	3900.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 23:11:00	2026-10-26 23:11:00	6	\N
75	16600.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 00:28:00	2026-10-27 00:28:00	6	\N
76	27120.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 15:45:00	2026-10-26 15:45:00	6	\N
77	8300.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 22:02:00	2026-10-26 22:02:00	6	\N
78	19140.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-26 23:19:00	2026-10-26 23:19:00	6	\N
79	23420.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 00:36:00	2026-10-27 00:36:00	6	\N
85	16600.00	cancelado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 17:31:00	2026-10-27 17:31:00	7	\N
86	32720.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 22:48:00	2026-10-27 22:48:00	7	\N
87	20020.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 23:05:00	2026-10-27 23:05:00	7	\N
88	7820.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-28 00:22:00	2026-10-28 00:22:00	7	\N
89	11720.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-28 01:09:00	2026-10-28 01:09:00	7	\N
90	14600.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 16:56:00	2026-10-27 16:56:00	7	\N
91	3900.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 23:13:00	2026-10-27 23:13:00	7	\N
92	11700.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-28 00:30:00	2026-10-28 00:30:00	7	\N
93	20500.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-28 01:17:00	2026-10-28 01:17:00	7	\N
94	3900.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 22:04:00	2026-10-27 22:04:00	7	\N
95	16600.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 15:21:00	2026-10-27 15:21:00	7	\N
97	3500.00	entregado	efectivo	jaime	\N	2026-10-27 22:56:40.542	2026-10-27 23:47:26.907	7	2a6e1e0d-60c3-4ea9-acdb-21c227fa1a97
80	14400.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 15:06:00	2026-10-27 23:47:30.135	7	\N
84	28320.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-28 00:14:00	2026-10-27 23:47:22.915	7	\N
82	3900.00	entregado	transferencia	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 22:40:00	2026-10-27 23:47:27.818	7	\N
83	12200.00	entregado	efectivo	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-27 23:57:00	2026-10-27 23:47:24.866	7	\N
81	16100.00	entregado	tarjeta	[SEED_DASHBOARD_V1] Cliente local	[SEED_DASHBOARD_V1]	2026-10-28 01:23:00	2026-10-27 23:05:58.615	7	\N
98	13320.00	entregado	transferencia	sss	\N	2026-10-27 23:05:26.89	2026-10-27 23:47:25.756	7	989d84ef-e29c-479f-b147-13f95da85009
96	14400.00	entregado	efectivo	rt	\N	2026-10-27 22:25:28.459	2026-10-27 23:47:28.949	7	a5c292c1-360e-4725-8690-d589208bf011
99	7820.00	entregado	tarjeta	dasdasd	\N	2026-10-27 23:48:13.044	2026-10-27 23:48:38.554	8	a7530226-b852-4452-8c42-8eba5e16dc28
101	5500.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:02:33.455	2026-10-28 00:25:19.408	10	1f5c8bfb-979f-4aac-a261-279821623de4
102	5500.00	entregado	efectivo	Prueba Fácil	\N	2026-10-28 00:02:52.878	2026-10-28 00:25:18.38	10	a3445f56-4949-424b-9e70-bfeccc596f94
103	3900.00	entregado	efectivo	Flujo Interfaz	\N	2026-10-28 00:03:02.622	2026-10-28 00:25:17.314	10	0d9377d1-24b8-46fa-87a7-a0eed8431b86
104	5500.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:03:25.699	2026-10-28 00:25:16.331	10	2b67c9ba-dd54-46fd-a9b1-05ce70d54f25
105	5500.00	entregado	efectivo	Prueba Fácil	\N	2026-10-28 00:03:44.416	2026-10-28 00:25:12.774	10	bed7e711-085b-4d40-8678-312e938e0127
100	7820.00	entregado	tarjeta	fdsfds	\N	2026-10-27 23:59:23.767	2026-10-28 00:25:56.99	10	d99159c7-0038-4494-a8f5-fc6d97c7f351
106	5500.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:04:47.157	2026-10-28 00:25:10.977	10	a37700b4-0bb3-4d3a-8f7e-cc7b77ba2cf2
107	5500.00	entregado	efectivo	Prueba Fácil	\N	2026-10-28 00:05:03.541	2026-10-28 00:25:09.522	10	13e3c01d-993d-435c-8193-5c60b41a8c59
113	2900.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:06:16.212	2026-10-28 00:25:05.51	10	9ac85572-ce2d-4db4-81f1-f70789234efa
128	7820.00	entregado	tarjeta	nkhuj	\N	2026-10-28 00:45:31.854	2026-10-28 01:43:01.361	11	4a120b7c-54b3-47a0-b5a7-8aac8464208b
127	7800.00	entregado	tarjeta	fdgfdg	\N	2026-10-28 00:44:56.365	2026-10-28 01:43:02.422	11	b16b1325-286d-4291-afd8-67c90b1a4061
112	2900.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:06:15.88	2026-10-28 00:25:06.159	10	3a776bc2-3396-4e3f-a8f9-429dc45b3b2a
126	2900.00	entregado	tarjeta	fsdf	\N	2026-10-28 00:38:52.607	2026-10-28 01:43:03.382	11	ca2ff760-f349-44a9-accf-bd7c5e76a30d
111	2900.00	entregado	efectivo	Prueba Fácil	\N	2026-10-28 00:05:45.807	2026-10-28 00:25:06.821	10	d982c66f-53bd-48a0-a388-b5e86b0a8551
125	2900.00	entregado	tarjeta	sadasd	\N	2026-10-28 00:38:36.389	2026-10-28 01:43:04.459	11	de02d9c4-1b48-47c1-849d-78f8ac0d66b9
110	2900.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:05:28.562	2026-10-28 00:25:07.462	10	3076a6c2-2d2d-4652-97dc-30e48c7380d7
124	8300.00	entregado	tarjeta	dasdasd	\N	2026-10-28 00:26:24.297	2026-10-28 01:43:05.505	11	621b1611-8d2c-484a-9e4d-ab060500aa73
109	2900.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:05:13.584	2026-10-28 00:25:08.116	10	ca3a98ba-d6c2-4a3a-8dc4-b8937cdb7b8a
108	3900.00	entregado	efectivo	Flujo Interfaz	\N	2026-10-28 00:05:12.101	2026-10-28 00:25:08.796	10	a03ee971-d0a5-4ef7-8eda-65a4cef4d5fa
137	2900.00	listo	efectivo	Prueba Fácil	\N	2026-10-28 02:18:30.42	2026-10-28 02:18:30.603	12	41387620-0267-4bdb-93af-2aa3bb65c750
131	3900.00	entregado	tarjeta	Luciano	\N	2026-10-28 01:43:24.819	2026-10-28 01:44:19.331	11	de777f53-1af0-4bd3-8aee-db5d67681b24
123	8300.00	entregado	transferencia	kñklñ	\N	2026-10-28 00:20:59.252	2026-10-28 00:25:54.946	10	67d41259-7afe-4de1-8d7d-7c303de493b5
122	2900.00	entregado	tarjeta	vbvv	\N	2026-10-28 00:20:24.602	2026-10-28 00:25:55.997	10	21b0aa6b-601b-4f2d-89ba-0da4380c5c68
144	3900.00	en_preparacion	tarjeta	lllllllll	\N	2026-10-28 15:03:00.028	2026-10-28 15:03:10.809	12	66c2837c-1ef0-4eff-8ae5-1af04edcadb4
139	2900.00	listo	efectivo	Prueba Caja	\N	2026-10-28 02:20:12.232	2026-10-28 02:20:12.397	12	d9ef1a89-dd47-4901-a659-a619eefc3067
121	2900.00	entregado	efectivo	Prueba Fácil	\N	2026-10-28 00:08:05.415	2026-10-28 00:17:45.429	10	6bc98a24-1bf8-4c4d-b6c8-3a2ae875704a
120	2900.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:07:48.208	2026-10-28 00:24:59.513	10	53864e1c-f778-427e-b0b8-4b494e8e8d4f
119	3900.00	entregado	efectivo	Flujo Interfaz	\N	2026-10-28 00:07:45.877	2026-10-28 00:25:00.495	10	04752904-7364-43f7-aa99-fbba0ea51c14
118	2900.00	entregado	efectivo	Prueba Fácil	\N	2026-10-28 00:07:36.201	2026-10-28 00:25:01.449	10	7bc6865c-1b4b-49b2-b18f-d97a8ed569f4
117	2900.00	entregado	efectivo	Prueba Caja	\N	2026-10-28 00:07:16.599	2026-10-28 00:25:02.283	10	58a61531-b54f-4e77-aba5-65ca0dbf4c16
116	3900.00	entregado	efectivo	Flujo Interfaz	\N	2026-10-28 00:06:35.747	2026-10-28 00:25:03.329	10	95b9bfcb-b3ce-4535-835a-6c37b28e8980
115	2900.00	entregado	efectivo	Prueba Fácil	\N	2026-10-28 00:06:32.329	2026-10-28 00:25:04.111	10	51ece3e0-d2ae-46d9-9a1c-2dda93a6ad01
114	2900.00	entregado	efectivo	Prueba Fácil	\N	2026-10-28 00:06:31.872	2026-10-28 00:25:04.871	10	62bf6d5d-0b5a-4c08-aa6b-b12715bb65af
140	2900.00	listo	efectivo	Prueba Caja	\N	2026-10-28 02:20:12.557	2026-10-28 02:20:12.679	12	42e7a9dd-2809-4b13-aad7-3516f7f8f385
133	5000.00	entregado	transferencia	Luciano	\N	2026-10-28 01:48:16.375	2026-10-28 01:49:04.596	11	6d046543-628d-410e-ad44-2bdbb3cffd64
141	2900.00	listo	efectivo	Prueba Fácil	\N	2026-10-28 02:20:28.666	2026-10-28 02:20:28.744	12	29df6f3b-e782-46f5-8b8e-045facf0844b
132	3900.00	entregado	efectivo	Juan	\N	2026-10-28 01:45:47.762	2026-10-28 01:49:05.696	11	176928b7-6fc8-4062-8ed9-3598dc566915
130	3500.00	entregado	tarjeta	dasdas	\N	2026-10-28 00:48:34.494	2026-10-28 01:42:57.593	11	5ced40cd-73c3-41df-b60e-58a09df8059e
129	8300.00	entregado	transferencia	bhjhjvbm	\N	2026-10-28 00:45:47.395	2026-10-28 01:42:58.575	11	4d1c0ded-4e16-4897-a228-fa2514ea9cc3
134	2900.00	listo	efectivo	Prueba Caja	\N	2026-10-28 02:18:12.697	2026-10-28 02:18:13.012	12	0fea6900-a3d6-456d-8d6b-7df2a34de8b0
142	2900.00	listo	efectivo	Prueba Fácil	\N	2026-10-28 02:20:28.954	2026-10-28 02:20:29.027	12	09c425da-b8d7-434a-8327-4d0a24a187ee
135	2900.00	listo	efectivo	Prueba Caja	\N	2026-10-28 02:18:13.1	2026-10-28 02:18:13.251	12	8327e313-35c7-4d7f-82eb-33be755a5287
136	2900.00	listo	efectivo	Prueba Fácil	\N	2026-10-28 02:18:29.589	2026-10-28 02:18:29.767	12	f361ff86-c990-4320-a0c0-d69c5578d0f3
143	3900.00	listo	efectivo	Flujo Interfaz	\N	2026-10-28 02:20:31.796	2026-10-28 02:20:33.864	12	d1efeb2d-9b47-4c83-9976-0f8736631ccc
138	3900.00	listo	efectivo	Flujo Interfaz	\N	2026-10-28 02:18:37.26	2026-10-28 15:02:33.724	12	b82a238c-f16e-49a9-bd68-e3c11bc1240a
\.


--
-- Data for Name: Producto; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Producto" (id, nombre, descripcion, precio, precio_original, descuento_porcentaje, disponible, destacado, promocion, tipo, controla_stock, imagen_url, "createdAt", "updatedAt") FROM stdin;
4	4 Completos Alemanes	Promoción de 4 completos alemanes	10500.00	13333.00	\N	t	f	t	promo	f	\N	2026-10-27 15:42:04.576	2026-10-27 15:42:04.576
5	ARMA TU SANDWICH	ELIGE LA CARNE DE TU SANDWICH Y 2 INGREDIENTES A ELECCIÓN	5500.00	7571.00	27	t	t	f	producto	t	\N	2026-10-27 15:42:04.58	2026-10-27 15:42:04.58
6	BARROS LUCO SANDWICH	SANDWICH DE CHURRASCO QUESO Y MAYONESA	5500.00	6857.00	\N	t	f	f	producto	t	\N	2026-10-27 15:42:04.589	2026-10-27 15:42:04.589
7	CHACARERO SANDWICH	SANDWICH DE CHURRASCO O PALTA, TOMATE, MAYONESA Y POROTOS VERDES	5000.00	6571.00	23	t	f	f	producto	t	\N	2026-10-27 15:42:04.594	2026-10-27 15:42:04.594
8	Completo Alemán	Completo vienesa, chucrut, tomate, mayonesa casera	2900.00	3857.00	\N	t	f	f	producto	t	\N	2026-10-27 15:42:04.599	2026-10-27 15:42:04.599
9	Completo Dinámico	Especial vienesa, chucrut, palta, tomate, mayonesa casera	3900.00	4857.00	\N	t	f	f	producto	t	\N	2026-10-27 15:42:04.604	2026-10-27 15:42:04.604
10	Completo Hass Italiano	Completo italiano con carne a elección, palta, tomate y mayonesa casera	3500.00	4857.00	\N	t	t	f	producto	t	\N	2026-10-27 15:42:04.608	2026-10-27 15:42:04.608
11	Completo Italiano	Completo vienesa, tomate, palta, mayonesa casera	3900.00	4571.00	\N	t	f	f	producto	t	\N	2026-10-27 15:42:04.614	2026-10-27 15:42:04.614
12	SANDWICH LUCO PATRÓN	SANDWICH DE CARNE A ELECCIÓN QUESO CHOCLO TOMATE MAYONESA	4900.00	7000.00	\N	t	f	f	producto	t	\N	2026-10-27 15:42:04.619	2026-10-27 15:42:04.619
1	2x1 Completo Italiano o Alemán	2 completos italianos, palta, tomate, mayonesa casera	3900.00	5571.00	30	t	t	t	promo	f	\N	2026-10-27 15:42:04.563	2026-10-27 23:53:12.953
2	2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección	2 sandwich iguales, carne y 2 ingredientes a elección	8300.00	13811.00	43	t	t	t	promo	f	\N	2026-10-27 15:42:04.569	2026-10-27 23:53:15.444
3	2x1 Sandwich Italiano Carne a Elección	2x1 sandwich italiana, palta, tomate, mayonesa casera	7820.00	11913.00	34	t	t	t	promo	f	\N	2026-10-27 15:42:04.573	2026-10-27 23:53:26.7
13	promo	21321	5000.00	\N	\N	f	f	f	producto	t	\N	2026-10-28 01:46:50.84	2026-10-28 15:16:07.307
\.


--
-- Data for Name: Turno; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Turno" (id, "usuarioId", estado, "fechaInicio", "fechaCierre", resumen) FROM stdin;
1	3	cerrado	2026-10-21 14:30:00	2026-10-22 02:00:00	{"date": "2026-10-21", "source": "[SEED_DASHBOARD_V1]"}
2	3	cerrado	2026-10-22 14:30:00	2026-10-23 02:00:00	{"date": "2026-10-22", "source": "[SEED_DASHBOARD_V1]"}
3	3	cerrado	2026-10-23 14:30:00	2026-10-24 02:00:00	{"date": "2026-10-23", "source": "[SEED_DASHBOARD_V1]"}
4	3	cerrado	2026-10-24 14:30:00	2026-10-25 02:00:00	{"date": "2026-10-24", "source": "[SEED_DASHBOARD_V1]"}
5	3	cerrado	2026-10-25 14:30:00	2026-10-26 02:00:00	{"date": "2026-10-25", "source": "[SEED_DASHBOARD_V1]"}
6	3	cerrado	2026-10-26 14:30:00	2026-10-27 02:00:00	{"date": "2026-10-26", "source": "[SEED_DASHBOARD_V1]"}
7	3	cerrado	2026-10-27 14:30:00	2026-10-27 23:47:39.135	{"id": "turno-7", "pedidos": [{"id": 80, "total": 14400, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 10500, "productoId": 4, "precioUnitario": 10500, "productoNombre": "4 Completos Alemanes"}, {"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-27T15:06:00.000Z", "metodoPago": "efectivo", "numeroTurno": 1, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 95, "total": 16600, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}, {"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "createdAt": "2026-10-27T15:21:00.000Z", "metodoPago": "tarjeta", "numeroTurno": 2, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 90, "total": 14600, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}, {"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"cantidad": 2, "subtotal": 7800, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-27T16:56:00.000Z", "metodoPago": "transferencia", "numeroTurno": 3, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 85, "total": 16600, "estado": "cancelado", "detalles": [{"cantidad": 2, "subtotal": 16600, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "createdAt": "2026-10-27T17:31:00.000Z", "metodoPago": "efectivo", "numeroTurno": 4, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 94, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-27T22:04:00.000Z", "metodoPago": "tarjeta", "numeroTurno": 5, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 96, "total": 14400, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 10500, "productoId": 4, "precioUnitario": 10500, "productoNombre": "4 Completos Alemanes"}, {"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-27T22:25:28.459Z", "metodoPago": "efectivo", "numeroTurno": 6, "observacion": null, "clienteNombre": "rt"}, {"id": 82, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-27T22:40:00.000Z", "metodoPago": "transferencia", "numeroTurno": 7, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 86, "total": 32720, "estado": "entregado", "detalles": [{"cantidad": 3, "subtotal": 24900, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}, {"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}], "createdAt": "2026-10-27T22:48:00.000Z", "metodoPago": "tarjeta", "numeroTurno": 8, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 97, "total": 3500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3500, "productoId": 10, "precioUnitario": 3500, "productoNombre": "Completo Hass Italiano"}], "createdAt": "2026-10-27T22:56:40.542Z", "metodoPago": "efectivo", "numeroTurno": 9, "observacion": null, "clienteNombre": "jaime"}, {"id": 87, "total": 20020, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}, {"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}, {"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-27T23:05:00.000Z", "metodoPago": "tarjeta", "numeroTurno": 10, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 98, "total": 13320, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 5500, "productoId": 5, "precioUnitario": 5500, "productoNombre": "ARMA TU SANDWICH"}, {"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}], "createdAt": "2026-10-27T23:05:26.890Z", "metodoPago": "transferencia", "numeroTurno": 11, "observacion": null, "clienteNombre": "sss"}, {"id": 91, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-27T23:13:00.000Z", "metodoPago": "efectivo", "numeroTurno": 12, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 83, "total": 12200, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "createdAt": "2026-10-27T23:57:00.000Z", "metodoPago": "efectivo", "numeroTurno": 13, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 84, "total": 28320, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"cantidad": 2, "subtotal": 16600, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}, {"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}], "createdAt": "2026-10-28T00:14:00.000Z", "metodoPago": "tarjeta", "numeroTurno": 14, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 88, "total": 7820, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}], "createdAt": "2026-10-28T00:22:00.000Z", "metodoPago": "efectivo", "numeroTurno": 15, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 92, "total": 11700, "estado": "entregado", "detalles": [{"cantidad": 2, "subtotal": 7800, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-28T00:30:00.000Z", "metodoPago": "tarjeta", "numeroTurno": 16, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 89, "total": 11720, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}, {"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-28T01:09:00.000Z", "metodoPago": "tarjeta", "numeroTurno": 17, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 93, "total": 20500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}, {"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "createdAt": "2026-10-28T01:17:00.000Z", "metodoPago": "efectivo", "numeroTurno": 18, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}, {"id": 81, "total": 16100, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "createdAt": "2026-10-28T01:23:00.000Z", "metodoPago": "tarjeta", "numeroTurno": 19, "observacion": "[SEED_DASHBOARD_V1]", "clienteNombre": "[SEED_DASHBOARD_V1] Cliente local"}], "usuario": {"role": "admin", "label": "Administrador", "username": "admin"}, "usuarioId": "admin", "fechaCierre": "2026-10-27T23:47:39.135Z", "fechaInicio": "2026-10-27T14:30:00.000Z", "totalPedidos": 19, "totalTarjeta": 141080, "totalVendido": 249620, "totalEfectivo": 76720, "totalPendiente": 0, "pedidosCancelados": 1, "pedidosEntregados": 18, "pedidosPendientes": 0, "productosVendidos": [{"total": 70200, "cantidad": 18, "productoId": 1, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"total": 99600, "cantidad": 12, "productoId": 2, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}, {"total": 46920, "cantidad": 6, "productoId": 3, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}, {"total": 21000, "cantidad": 2, "productoId": 4, "productoNombre": "4 Completos Alemanes"}, {"total": 2900, "cantidad": 1, "productoId": 8, "productoNombre": "Completo Alemán"}, {"total": 3500, "cantidad": 1, "productoId": 10, "productoNombre": "Completo Hass Italiano"}, {"total": 5500, "cantidad": 1, "productoId": 5, "productoNombre": "ARMA TU SANDWICH"}], "totalTransferencia": 31820}
8	1	cerrado	2026-10-27 23:48:08.717	2026-10-27 23:48:40.8	{"id": "turno-8", "pedidos": [{"id": 99, "total": 7820, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}], "createdAt": "2026-10-27T23:48:13.044Z", "metodoPago": "tarjeta", "numeroTurno": 1, "observacion": null, "clienteNombre": "dasdasd"}], "usuario": {"role": "cajero", "label": "Cajero", "username": "cajero"}, "usuarioId": "cajero", "fechaCierre": "2026-10-27T23:48:40.800Z", "fechaInicio": "2026-10-27T23:48:08.717Z", "totalPedidos": 1, "totalTarjeta": 7820, "totalVendido": 7820, "totalEfectivo": 0, "totalPendiente": 0, "pedidosCancelados": 0, "pedidosEntregados": 1, "pedidosPendientes": 0, "productosVendidos": [{"total": 7820, "cantidad": 1, "productoId": 3, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}], "totalTransferencia": 0}
9	1	cerrado	2026-10-27 23:50:51.326	2026-10-27 23:50:53.694	{"id": "turno-9", "pedidos": [], "usuario": {"role": "cajero", "label": "Cajero", "username": "cajero"}, "usuarioId": "cajero", "fechaCierre": "2026-10-27T23:50:53.694Z", "fechaInicio": "2026-10-27T23:50:51.326Z", "totalPedidos": 0, "totalTarjeta": 0, "totalVendido": 0, "totalEfectivo": 0, "totalPendiente": 0, "pedidosCancelados": 0, "pedidosEntregados": 0, "pedidosPendientes": 0, "productosVendidos": [], "totalTransferencia": 0}
10	1	cerrado	2026-10-27 23:59:17.917	2026-10-28 00:26:11.608	{"id": "turno-10", "pedidos": [{"id": 100, "total": 7820, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}], "createdAt": "2026-10-27T23:59:23.767Z", "metodoPago": "tarjeta", "numeroTurno": 1, "observacion": null, "clienteNombre": "fdsfds"}, {"id": 101, "total": 5500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 5500, "productoId": 5, "precioUnitario": 5500, "productoNombre": "ARMA TU SANDWICH"}], "createdAt": "2026-10-28T00:02:33.455Z", "metodoPago": "efectivo", "numeroTurno": 2, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 102, "total": 5500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 5500, "productoId": 5, "precioUnitario": 5500, "productoNombre": "ARMA TU SANDWICH"}], "createdAt": "2026-10-28T00:02:52.878Z", "metodoPago": "efectivo", "numeroTurno": 3, "observacion": null, "clienteNombre": "Prueba Fácil"}, {"id": 103, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 11, "precioUnitario": 3900, "productoNombre": "Completo Italiano"}], "createdAt": "2026-10-28T00:03:02.622Z", "metodoPago": "efectivo", "numeroTurno": 4, "observacion": null, "clienteNombre": "Flujo Interfaz"}, {"id": 104, "total": 5500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 5500, "productoId": 5, "precioUnitario": 5500, "productoNombre": "ARMA TU SANDWICH"}], "createdAt": "2026-10-28T00:03:25.699Z", "metodoPago": "efectivo", "numeroTurno": 5, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 105, "total": 5500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 5500, "productoId": 5, "precioUnitario": 5500, "productoNombre": "ARMA TU SANDWICH"}], "createdAt": "2026-10-28T00:03:44.416Z", "metodoPago": "efectivo", "numeroTurno": 6, "observacion": null, "clienteNombre": "Prueba Fácil"}, {"id": 106, "total": 5500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 5500, "productoId": 6, "precioUnitario": 5500, "productoNombre": "BARROS LUCO SANDWICH"}], "createdAt": "2026-10-28T00:04:47.157Z", "metodoPago": "efectivo", "numeroTurno": 7, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 107, "total": 5500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 5500, "productoId": 6, "precioUnitario": 5500, "productoNombre": "BARROS LUCO SANDWICH"}], "createdAt": "2026-10-28T00:05:03.541Z", "metodoPago": "efectivo", "numeroTurno": 8, "observacion": null, "clienteNombre": "Prueba Fácil"}, {"id": 108, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 11, "precioUnitario": 3900, "productoNombre": "Completo Italiano"}], "createdAt": "2026-10-28T00:05:12.101Z", "metodoPago": "efectivo", "numeroTurno": 9, "observacion": null, "clienteNombre": "Flujo Interfaz"}, {"id": 109, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:05:13.584Z", "metodoPago": "efectivo", "numeroTurno": 10, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 110, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:05:28.562Z", "metodoPago": "efectivo", "numeroTurno": 11, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 111, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:05:45.807Z", "metodoPago": "efectivo", "numeroTurno": 12, "observacion": null, "clienteNombre": "Prueba Fácil"}, {"id": 112, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:06:15.880Z", "metodoPago": "efectivo", "numeroTurno": 13, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 113, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:06:16.212Z", "metodoPago": "efectivo", "numeroTurno": 14, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 114, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:06:31.872Z", "metodoPago": "efectivo", "numeroTurno": 15, "observacion": null, "clienteNombre": "Prueba Fácil"}, {"id": 115, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:06:32.329Z", "metodoPago": "efectivo", "numeroTurno": 16, "observacion": null, "clienteNombre": "Prueba Fácil"}, {"id": 116, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 11, "precioUnitario": 3900, "productoNombre": "Completo Italiano"}], "createdAt": "2026-10-28T00:06:35.747Z", "metodoPago": "efectivo", "numeroTurno": 17, "observacion": null, "clienteNombre": "Flujo Interfaz"}, {"id": 117, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:07:16.599Z", "metodoPago": "efectivo", "numeroTurno": 18, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 118, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:07:36.201Z", "metodoPago": "efectivo", "numeroTurno": 19, "observacion": null, "clienteNombre": "Prueba Fácil"}, {"id": 119, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 11, "precioUnitario": 3900, "productoNombre": "Completo Italiano"}], "createdAt": "2026-10-28T00:07:45.877Z", "metodoPago": "efectivo", "numeroTurno": 20, "observacion": null, "clienteNombre": "Flujo Interfaz"}, {"id": 120, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:07:48.208Z", "metodoPago": "efectivo", "numeroTurno": 21, "observacion": null, "clienteNombre": "Prueba Caja"}, {"id": 121, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:08:05.415Z", "metodoPago": "efectivo", "numeroTurno": 22, "observacion": null, "clienteNombre": "Prueba Fácil"}, {"id": 122, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:20:24.602Z", "metodoPago": "tarjeta", "numeroTurno": 23, "observacion": null, "clienteNombre": "vbvv"}, {"id": 123, "total": 8300, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "createdAt": "2026-10-28T00:20:59.252Z", "metodoPago": "transferencia", "numeroTurno": 24, "observacion": null, "clienteNombre": "kñklñ"}], "usuario": {"role": "cajero", "label": "Cajero", "username": "cajero"}, "usuarioId": "cajero", "fechaCierre": "2026-10-28T00:26:11.608Z", "fechaInicio": "2026-10-27T23:59:17.917Z", "totalPedidos": 24, "totalTarjeta": 10720, "totalVendido": 99520, "totalEfectivo": 80500, "totalPendiente": 0, "pedidosCancelados": 0, "pedidosEntregados": 24, "pedidosPendientes": 0, "productosVendidos": [{"total": 34800, "cantidad": 12, "productoId": 8, "productoNombre": "Completo Alemán"}, {"total": 22000, "cantidad": 4, "productoId": 5, "productoNombre": "ARMA TU SANDWICH"}, {"total": 15600, "cantidad": 4, "productoId": 11, "productoNombre": "Completo Italiano"}, {"total": 11000, "cantidad": 2, "productoId": 6, "productoNombre": "BARROS LUCO SANDWICH"}, {"total": 7820, "cantidad": 1, "productoId": 3, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}, {"total": 8300, "cantidad": 1, "productoId": 2, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "totalTransferencia": 8300}
11	1	cerrado	2026-10-28 00:26:19.642	2026-10-28 01:50:51.521	{"id": "turno-11", "pedidos": [{"id": 124, "total": 8300, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "createdAt": "2026-10-28T00:26:24.297Z", "metodoPago": "tarjeta", "numeroTurno": 1, "observacion": null, "clienteNombre": "dasdasd"}, {"id": 125, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:38:36.389Z", "metodoPago": "tarjeta", "numeroTurno": 2, "observacion": null, "clienteNombre": "sadasd"}, {"id": 126, "total": 2900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 2900, "productoId": 8, "precioUnitario": 2900, "productoNombre": "Completo Alemán"}], "createdAt": "2026-10-28T00:38:52.607Z", "metodoPago": "tarjeta", "numeroTurno": 3, "observacion": null, "clienteNombre": "fsdf"}, {"id": 127, "total": 7800, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-28T00:44:56.365Z", "metodoPago": "tarjeta", "numeroTurno": 4, "observacion": null, "clienteNombre": "fdgfdg"}, {"id": 128, "total": 7820, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 7820, "productoId": 3, "precioUnitario": 7820, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}], "createdAt": "2026-10-28T00:45:31.854Z", "metodoPago": "tarjeta", "numeroTurno": 5, "observacion": null, "clienteNombre": "nkhuj"}, {"id": 129, "total": 8300, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 8300, "productoId": 2, "precioUnitario": 8300, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}], "createdAt": "2026-10-28T00:45:47.395Z", "metodoPago": "transferencia", "numeroTurno": 6, "observacion": null, "clienteNombre": "bhjhjvbm"}, {"id": 130, "total": 3500, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3500, "productoId": 10, "precioUnitario": 3500, "productoNombre": "Completo Hass Italiano"}], "createdAt": "2026-10-28T00:48:34.494Z", "metodoPago": "tarjeta", "numeroTurno": 7, "observacion": null, "clienteNombre": "dasdas"}, {"id": 131, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-28T01:43:24.819Z", "metodoPago": "tarjeta", "numeroTurno": 8, "observacion": null, "clienteNombre": "Luciano"}, {"id": 132, "total": 3900, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 3900, "productoId": 1, "precioUnitario": 3900, "productoNombre": "2x1 Completo Italiano o Alemán"}], "createdAt": "2026-10-28T01:45:47.762Z", "metodoPago": "efectivo", "numeroTurno": 9, "observacion": null, "clienteNombre": "Juan"}, {"id": 133, "total": 5000, "estado": "entregado", "detalles": [{"cantidad": 1, "subtotal": 5000, "productoId": 13, "precioUnitario": 5000, "productoNombre": "promo"}], "createdAt": "2026-10-28T01:48:16.375Z", "metodoPago": "transferencia", "numeroTurno": 10, "observacion": null, "clienteNombre": "Luciano"}], "usuario": {"role": "cajero", "label": "Cajero", "username": "cajero"}, "usuarioId": "cajero", "fechaCierre": "2026-10-28T01:50:51.521Z", "fechaInicio": "2026-10-28T00:26:19.642Z", "totalPedidos": 10, "totalTarjeta": 37120, "totalVendido": 54320, "totalEfectivo": 3900, "totalPendiente": 0, "pedidosCancelados": 0, "pedidosEntregados": 10, "pedidosPendientes": 0, "productosVendidos": [{"total": 15600, "cantidad": 4, "productoId": 1, "productoNombre": "2x1 Completo Italiano o Alemán"}, {"total": 16600, "cantidad": 2, "productoId": 2, "productoNombre": "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"}, {"total": 5800, "cantidad": 2, "productoId": 8, "productoNombre": "Completo Alemán"}, {"total": 7820, "cantidad": 1, "productoId": 3, "productoNombre": "2x1 Sandwich Italiano Carne a Elección"}, {"total": 3500, "cantidad": 1, "productoId": 10, "productoNombre": "Completo Hass Italiano"}, {"total": 5000, "cantidad": 1, "productoId": 13, "productoNombre": "promo"}], "totalTransferencia": 13300}
12	1	abierto	2026-10-28 02:18:12.431	\N	\N
\.


--
-- Data for Name: Usuario; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Usuario" (id, username, email, "passwordHash", role, label, activo, "createdAt", "updatedAt") FROM stdin;
1	cajero	cajero@demo.cl	$2b$12$la.VxICbh1Zl39xkoh4ncuxOaiGhg0SQroZLDUjoUoOKfds7pOY8m	cajero	Cajero	t	2026-10-27 15:42:04.54	2026-10-27 15:42:04.54
2	cocina	cocina@demo.cl	$2b$12$la.VxICbh1Zl39xkoh4ncuxOaiGhg0SQroZLDUjoUoOKfds7pOY8m	cocina	Cocina	t	2026-10-27 15:42:04.547	2026-10-27 15:42:04.547
3	admin	admin@demo.cl	$2b$12$la.VxICbh1Zl39xkoh4ncuxOaiGhg0SQroZLDUjoUoOKfds7pOY8m	admin	Administrador	t	2026-10-27 15:42:04.549	2026-10-27 15:42:04.549
\.


--
-- Data for Name: Variante; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Variante" (id, "productoId", nombre, descripcion, orden, disponible, "createdAt", "updatedAt") FROM stdin;
1	5	churrasco	\N	1	t	2026-10-27 15:42:04.586	2026-10-27 15:42:04.586
2	5	pollo	\N	2	t	2026-10-27 15:42:04.586	2026-10-27 15:42:04.586
3	5	lomito	\N	3	t	2026-10-27 15:42:04.586	2026-10-27 15:42:04.586
4	5	mechada	\N	4	t	2026-10-27 15:42:04.586	2026-10-27 15:42:04.586
5	10	vienesa	\N	1	t	2026-10-27 15:42:04.612	2026-10-27 15:42:04.612
6	10	churrasco	\N	2	t	2026-10-27 15:42:04.612	2026-10-27 15:42:04.612
7	12	churrasco	\N	1	t	2026-10-27 15:42:04.622	2026-10-27 15:42:04.622
8	12	pollo	\N	2	t	2026-10-27 15:42:04.622	2026-10-27 15:42:04.622
9	12	lomito	\N	3	t	2026-10-27 15:42:04.622	2026-10-27 15:42:04.622
\.


--
-- Data for Name: _CategoriaToProducto; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."_CategoriaToProducto" ("A", "B") FROM stdin;
1	1
1	2
1	3
2	4
1	5
4	6
1	7
3	8
3	9
3	10
3	11
4	12
5	13
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
208ac5b7-4985-437f-8cb3-29f8c44ee91a	2bab8497ac0639faca3b879af69875fe8ed1aaf446c4dcb0dedad297deeee654	2026-10-27 15:42:02.691957+00	20260623000000_initial_schema	\N	\N	2026-10-27 15:42:02.583028+00	1
0081526e-b524-4d74-b7d6-412d14588747	004f0554a1b3ee388d754de0a291a42dcba926e3fac46831ca2724208303df0e	2026-10-27 15:42:02.711164+00	20260720000000_pedido_historial	\N	\N	2026-10-27 15:42:02.693138+00	1
7c9c5a8d-bdbb-4b81-8b9e-34d780bd6b4b	30899173e3cccafb65ef4d9401e2567a2f0c6f8fc7583b1b1262aa213d5d88d4	2026-10-27 15:42:02.726858+00	20260812000000_domain_integrity	\N	\N	2026-10-27 15:42:02.71232+00	1
32be2ce9-d8a0-482c-93e6-b1a24c8fcb20	e5152c9e4caf57f25d78b1a6e860934913698333c8a1edf62f6a3efbe4c81201	2026-10-27 15:42:02.733379+00	20260813000000_remove_redundant_integrity_rules	\N	\N	2026-10-27 15:42:02.727957+00	1
43e94dd5-232e-4b50-bb1b-ff18cb590cf8	fc346cfb44f8ca5a2cbb6fb4aedb753d4932967728e061f1cb66cd57a01488e7	2026-10-27 15:42:02.742708+00	20260818000000_repair_product_categories	\N	\N	2026-10-27 15:42:02.734484+00	1
be8233df-68f8-46aa-a702-cd40f5c93940	7ee8f4d794dedb4762f279a0355d448e9e4cd9aa06a59ede17423288cb2e171c	2026-10-27 15:42:02.750502+00	20260819000000_categoria_activa	\N	\N	2026-10-27 15:42:02.744345+00	1
a28a407f-e9f9-4d9d-8951-58483e8a12f3	1dcdb6d1726f9fe72488ba9aaa41f05ddf4bdddcf02086438e7dc5e6c6e845f9	2026-10-27 15:42:02.758093+00	20260902000000_pedido_idempotency	\N	\N	2026-10-27 15:42:02.751461+00	1
\.


--
-- Data for Name: pedido_historial; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.pedido_historial (id, pedido_id, usuario_id, accion, cambios, "createdAt") FROM stdin;
1	1	3	creado_por_seed_dashboard	\N	2026-10-21 15:00:00
2	2	3	creado_por_seed_dashboard	\N	2026-10-21 23:17:00
3	3	3	creado_por_seed_dashboard	\N	2026-10-22 00:34:00
4	4	3	creado_por_seed_dashboard	\N	2026-10-22 01:21:00
5	5	3	creado_por_seed_dashboard	\N	2026-10-21 22:08:00
6	6	3	creado_por_seed_dashboard	\N	2026-10-21 17:25:00
7	7	3	creado_por_seed_dashboard	\N	2026-10-22 00:42:00
8	8	3	creado_por_seed_dashboard	\N	2026-10-22 01:29:00
9	9	3	creado_por_seed_dashboard	\N	2026-10-21 22:16:00
10	10	3	creado_por_seed_dashboard	\N	2026-10-21 23:33:00
11	11	3	creado_por_seed_dashboard	\N	2026-10-21 16:50:00
12	12	3	creado_por_seed_dashboard	\N	2026-10-22 01:07:00
13	13	3	creado_por_seed_dashboard	\N	2026-10-22 16:11:00
14	14	3	creado_por_seed_dashboard	\N	2026-10-23 00:28:00
15	15	3	creado_por_seed_dashboard	\N	2026-10-23 01:15:00
16	16	3	creado_por_seed_dashboard	\N	2026-10-22 22:02:00
17	17	3	creado_por_seed_dashboard	\N	2026-10-22 23:19:00
18	18	3	creado_por_seed_dashboard	\N	2026-10-22 15:36:00
19	19	3	creado_por_seed_dashboard	\N	2026-10-23 01:23:00
20	20	3	creado_por_seed_dashboard	\N	2026-10-22 22:10:00
21	21	3	creado_por_seed_dashboard	\N	2026-10-22 23:27:00
22	22	3	creado_por_seed_dashboard	\N	2026-10-23 00:44:00
23	23	3	creado_por_seed_dashboard	\N	2026-10-22 17:01:00
24	24	3	creado_por_seed_dashboard	\N	2026-10-22 22:18:00
25	25	3	creado_por_seed_dashboard	\N	2026-10-22 23:35:00
26	26	3	creado_por_seed_dashboard	\N	2026-10-23 00:52:00
27	27	3	creado_por_seed_dashboard	\N	2026-10-23 01:09:00
28	28	3	creado_por_seed_dashboard	\N	2026-10-23 17:22:00
29	29	3	creado_por_seed_dashboard	\N	2026-10-24 01:09:00
30	30	3	creado_por_seed_dashboard	\N	2026-10-23 22:56:00
31	31	3	creado_por_seed_dashboard	\N	2026-10-23 23:13:00
32	32	3	creado_por_seed_dashboard	\N	2026-10-24 00:30:00
33	33	3	creado_por_seed_dashboard	\N	2026-10-23 16:47:00
34	34	3	creado_por_seed_dashboard	\N	2026-10-23 22:04:00
35	35	3	creado_por_seed_dashboard	\N	2026-10-23 23:21:00
36	36	3	creado_por_seed_dashboard	\N	2026-10-24 00:38:00
37	37	3	creado_por_seed_dashboard	\N	2026-10-24 15:33:00
38	38	3	creado_por_seed_dashboard	\N	2026-10-24 22:50:00
39	39	3	creado_por_seed_dashboard	\N	2026-10-24 23:07:00
40	40	3	creado_por_seed_dashboard	\N	2026-10-25 00:24:00
41	41	3	creado_por_seed_dashboard	\N	2026-10-25 01:11:00
42	42	3	creado_por_seed_dashboard	\N	2026-10-24 17:58:00
43	43	3	creado_por_seed_dashboard	\N	2026-10-24 23:15:00
44	44	3	creado_por_seed_dashboard	\N	2026-10-25 00:32:00
45	45	3	creado_por_seed_dashboard	\N	2026-10-25 01:19:00
46	46	3	creado_por_seed_dashboard	\N	2026-10-24 22:06:00
47	47	3	creado_por_seed_dashboard	\N	2026-10-24 16:23:00
48	48	3	creado_por_seed_dashboard	\N	2026-10-25 00:40:00
49	49	3	creado_por_seed_dashboard	\N	2026-10-25 01:27:00
50	50	3	creado_por_seed_dashboard	\N	2026-10-24 22:14:00
51	51	3	creado_por_seed_dashboard	\N	2026-10-24 23:31:00
52	52	3	creado_por_seed_dashboard	\N	2026-10-24 15:48:00
53	53	3	creado_por_seed_dashboard	\N	2026-10-25 01:05:00
54	54	3	creado_por_seed_dashboard	\N	2026-10-24 22:22:00
55	55	3	creado_por_seed_dashboard	\N	2026-10-25 16:44:00
56	56	3	creado_por_seed_dashboard	\N	2026-10-25 23:01:00
57	57	3	creado_por_seed_dashboard	\N	2026-10-26 00:18:00
58	58	3	creado_por_seed_dashboard	\N	2026-10-26 01:05:00
59	59	3	creado_por_seed_dashboard	\N	2026-10-25 22:52:00
60	60	3	creado_por_seed_dashboard	\N	2026-10-25 15:09:00
61	61	3	creado_por_seed_dashboard	\N	2026-10-26 00:26:00
62	62	3	creado_por_seed_dashboard	\N	2026-10-26 01:13:00
63	63	3	creado_por_seed_dashboard	\N	2026-10-25 22:00:00
64	64	3	creado_por_seed_dashboard	\N	2026-10-25 23:17:00
65	65	3	creado_por_seed_dashboard	\N	2026-10-25 17:34:00
66	66	3	creado_por_seed_dashboard	\N	2026-10-26 17:55:00
67	67	3	creado_por_seed_dashboard	\N	2026-10-27 00:12:00
68	68	3	creado_por_seed_dashboard	\N	2026-10-27 01:29:00
69	69	3	creado_por_seed_dashboard	\N	2026-10-26 22:46:00
70	70	3	creado_por_seed_dashboard	\N	2026-10-26 23:03:00
71	71	3	creado_por_seed_dashboard	\N	2026-10-26 16:20:00
72	72	3	creado_por_seed_dashboard	\N	2026-10-27 01:07:00
73	73	3	creado_por_seed_dashboard	\N	2026-10-26 22:54:00
74	74	3	creado_por_seed_dashboard	\N	2026-10-26 23:11:00
75	75	3	creado_por_seed_dashboard	\N	2026-10-27 00:28:00
76	76	3	creado_por_seed_dashboard	\N	2026-10-26 15:45:00
77	77	3	creado_por_seed_dashboard	\N	2026-10-26 22:02:00
78	78	3	creado_por_seed_dashboard	\N	2026-10-26 23:19:00
79	79	3	creado_por_seed_dashboard	\N	2026-10-27 00:36:00
80	80	3	creado_por_seed_dashboard	\N	2026-10-27 15:06:00
81	81	3	creado_por_seed_dashboard	\N	2026-10-28 01:23:00
82	82	3	creado_por_seed_dashboard	\N	2026-10-27 22:40:00
83	83	3	creado_por_seed_dashboard	\N	2026-10-27 23:57:00
84	84	3	creado_por_seed_dashboard	\N	2026-10-28 00:14:00
85	85	3	creado_por_seed_dashboard	\N	2026-10-27 17:31:00
86	86	3	creado_por_seed_dashboard	\N	2026-10-27 22:48:00
87	87	3	creado_por_seed_dashboard	\N	2026-10-27 23:05:00
88	88	3	creado_por_seed_dashboard	\N	2026-10-28 00:22:00
89	89	3	creado_por_seed_dashboard	\N	2026-10-28 01:09:00
90	90	3	creado_por_seed_dashboard	\N	2026-10-27 16:56:00
91	91	3	creado_por_seed_dashboard	\N	2026-10-27 23:13:00
92	92	3	creado_por_seed_dashboard	\N	2026-10-28 00:30:00
93	93	3	creado_por_seed_dashboard	\N	2026-10-28 01:17:00
94	94	3	creado_por_seed_dashboard	\N	2026-10-27 22:04:00
95	95	3	creado_por_seed_dashboard	\N	2026-10-27 15:21:00
96	83	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-27 22:51:24.721
97	81	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-27 22:55:42.535
98	82	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-27 22:55:42.572
99	96	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-27 22:55:42.595
100	80	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-27 22:55:42.619
101	81	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-27 22:55:42.853
102	96	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-27 22:55:42.878
103	80	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-27 22:55:42.901
104	97	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-27 22:57:57.474
105	97	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-27 22:58:00.656
106	98	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-27 23:05:37.936
107	98	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-27 23:05:38.669
108	81	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:05:58.619
109	84	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:47:22.919
110	83	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:47:24.869
111	98	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:47:25.759
112	97	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:47:26.909
113	82	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:47:27.82
114	96	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:47:28.951
115	80	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:47:30.137
116	99	1	pedido_modificado	{"nuevo": {"total": "7820", "detalles": [{"cantidad": 1, "productoId": 3, "varianteId": null, "personalizacion": {"aderezos": ["Ketchup"]}}], "metodoPago": "tarjeta", "observacion": null, "clienteNombre": "dasdasd"}, "anterior": {"total": "7820", "detalles": [{"cantidad": 1, "productoId": 3, "varianteId": null, "personalizacion": {"aderezos": ["Ketchup"]}}], "metodoPago": "tarjeta", "observacion": null, "clienteNombre": "dasdasd"}}	2026-10-27 23:48:23.943
117	99	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-27 23:48:30.951
118	99	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-27 23:48:31.31
119	99	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-27 23:48:38.556
120	101	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:02:33.987
121	101	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:02:34.154
122	102	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:02:53.397
123	102	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:02:53.569
124	103	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:03:06.23
125	103	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:03:06.673
126	104	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:03:25.906
127	104	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:03:25.95
128	105	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:03:44.478
129	105	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:03:44.508
130	106	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:04:47.463
131	106	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:04:47.546
132	107	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:05:03.699
133	107	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:05:03.781
134	109	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:05:13.878
135	109	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:05:14.351
136	108	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:05:15.301
137	108	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:05:15.617
138	110	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:05:28.772
139	110	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:05:28.816
140	111	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:05:45.88
141	111	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:05:45.906
142	112	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:06:16.036
143	112	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:06:16.083
144	113	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:06:16.331
145	113	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:06:16.379
146	114	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:06:31.942
147	114	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:06:31.968
148	115	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:06:32.392
149	115	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:06:32.423
150	116	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:06:37.792
151	116	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:06:38.015
152	117	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:07:17.061
153	117	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:07:17.147
154	118	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:07:36.367
155	118	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:07:36.467
156	120	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:07:48.593
157	120	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:07:48.662
158	119	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:07:48.871
159	119	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:07:49.232
160	121	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:08:05.463
161	121	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:08:05.487
162	100	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:11:48.815
163	121	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:17:45.432
164	120	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:24:59.516
165	119	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:00.496
166	118	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:01.451
167	117	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:02.285
168	116	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:03.331
169	115	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:04.113
170	114	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:04.873
171	113	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:05.511
172	112	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:06.162
173	111	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:06.822
174	110	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:07.463
175	109	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:08.118
176	108	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:08.798
177	107	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:09.524
178	106	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:10.978
179	105	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:12.775
180	104	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:16.333
181	103	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:17.316
182	102	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:18.381
183	101	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:19.409
184	123	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:25:41.793
185	123	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:25:42.723
186	100	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:25:43.489
187	122	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:25:44.166
188	122	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:25:44.462
189	123	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:54.949
190	122	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:55.998
191	100	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 00:25:56.992
192	124	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:29:49.998
193	124	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:37:02.76
194	126	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:44:34.124
195	126	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:44:34.885
196	125	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:44:46.671
197	125	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:44:47.656
198	127	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:45:03.732
199	127	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:45:04.776
200	128	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:45:59.392
201	128	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:46:00.728
202	129	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:47:58.059
203	129	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:48:01.298
204	130	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 00:48:46.729
205	130	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 00:48:47.142
206	130	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:42:57.595
207	129	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:42:58.577
208	128	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:43:01.363
209	127	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:43:02.424
210	126	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:43:03.383
211	125	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:43:04.46
212	124	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:43:05.506
213	131	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 01:44:08.274
214	131	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 01:44:11.478
215	131	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:44:19.333
216	132	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 01:45:58.764
217	132	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 01:45:59.406
218	133	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 01:48:43.593
219	133	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 01:48:44.721
220	133	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:49:04.598
221	132	1	estado_modificado	{"nuevo": "entregado", "anterior": "listo"}	2026-10-28 01:49:05.698
222	134	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:18:12.934
223	134	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:18:13.016
224	135	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:18:13.211
225	135	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:18:13.253
226	136	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:18:29.687
227	136	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:18:29.77
228	137	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:18:30.532
229	137	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:18:30.605
230	139	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:20:12.365
231	139	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:20:12.399
232	140	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:20:12.656
233	140	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:20:12.68
234	141	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:20:28.718
235	141	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:20:28.745
236	142	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:20:29.004
237	142	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:20:29.028
238	143	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 02:20:33.754
239	143	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 02:20:33.866
240	138	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 15:02:18.563
241	138	2	estado_modificado	{"nuevo": "listo", "anterior": "en_preparacion"}	2026-10-28 15:02:33.726
242	144	2	estado_modificado	{"nuevo": "en_preparacion", "anterior": "pendiente"}	2026-10-28 15:03:10.811
\.


--
-- Data for Name: producto_componentes; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.producto_componentes (id, producto_id, componente_id, cantidad, variante_id) FROM stdin;
1	4	8	4	\N
\.


--
-- Name: Categoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Categoria_id_seq"', 5, true);


--
-- Name: DetallePedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."DetallePedido_id_seq"', 245, true);


--
-- Name: Inventario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Inventario_id_seq"', 9, true);


--
-- Name: Pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Pedido_id_seq"', 144, true);


--
-- Name: Producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Producto_id_seq"', 13, true);


--
-- Name: Turno_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Turno_id_seq"', 12, true);


--
-- Name: Usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Usuario_id_seq"', 3, true);


--
-- Name: Variante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Variante_id_seq"', 9, true);


--
-- Name: pedido_historial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.pedido_historial_id_seq', 242, true);


--
-- Name: producto_componentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.producto_componentes_id_seq', 1, true);


--
-- Name: Categoria Categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Categoria"
    ADD CONSTRAINT "Categoria_pkey" PRIMARY KEY (id);


--
-- Name: DetallePedido DetallePedido_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DetallePedido"
    ADD CONSTRAINT "DetallePedido_pkey" PRIMARY KEY (id);


--
-- Name: Inventario Inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inventario"
    ADD CONSTRAINT "Inventario_pkey" PRIMARY KEY (id);


--
-- Name: Pedido Pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_pkey" PRIMARY KEY (id);


--
-- Name: Producto Producto_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Producto"
    ADD CONSTRAINT "Producto_pkey" PRIMARY KEY (id);


--
-- Name: Turno Turno_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Turno"
    ADD CONSTRAINT "Turno_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: Variante Variante_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Variante"
    ADD CONSTRAINT "Variante_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: pedido_historial pedido_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pedido_historial
    ADD CONSTRAINT pedido_historial_pkey PRIMARY KEY (id);


--
-- Name: producto_componentes producto_componentes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.producto_componentes
    ADD CONSTRAINT producto_componentes_pkey PRIMARY KEY (id);


--
-- Name: Categoria_nombre_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Categoria_nombre_key" ON public."Categoria" USING btree (nombre);


--
-- Name: DetallePedido_pedidoId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "DetallePedido_pedidoId_idx" ON public."DetallePedido" USING btree ("pedidoId");


--
-- Name: DetallePedido_productoId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "DetallePedido_productoId_idx" ON public."DetallePedido" USING btree ("productoId");


--
-- Name: DetallePedido_varianteId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "DetallePedido_varianteId_idx" ON public."DetallePedido" USING btree ("varianteId");


--
-- Name: Inventario_productoId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Inventario_productoId_key" ON public."Inventario" USING btree ("productoId");


--
-- Name: Pedido_idempotency_key_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Pedido_idempotency_key_key" ON public."Pedido" USING btree (idempotency_key);


--
-- Name: Pedido_turnoId_createdAt_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Pedido_turnoId_createdAt_idx" ON public."Pedido" USING btree ("turnoId", "createdAt");


--
-- Name: Pedido_turnoId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Pedido_turnoId_idx" ON public."Pedido" USING btree ("turnoId");


--
-- Name: Producto_nombre_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Producto_nombre_key" ON public."Producto" USING btree (nombre);


--
-- Name: Turno_estado_fechaCierre_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Turno_estado_fechaCierre_idx" ON public."Turno" USING btree (estado, "fechaCierre");


--
-- Name: Turno_estado_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Turno_estado_idx" ON public."Turno" USING btree (estado);


--
-- Name: Turno_unico_abierto; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Turno_unico_abierto" ON public."Turno" USING btree (estado) WHERE (estado = 'abierto'::text);


--
-- Name: Turno_usuarioId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Turno_usuarioId_idx" ON public."Turno" USING btree ("usuarioId");


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: Usuario_username_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Usuario_username_key" ON public."Usuario" USING btree (username);


--
-- Name: Variante_productoId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Variante_productoId_idx" ON public."Variante" USING btree ("productoId");


--
-- Name: Variante_productoId_nombre_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Variante_productoId_nombre_key" ON public."Variante" USING btree ("productoId", nombre);


--
-- Name: _CategoriaToProducto_AB_unique; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "_CategoriaToProducto_AB_unique" ON public."_CategoriaToProducto" USING btree ("A", "B");


--
-- Name: _CategoriaToProducto_B_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "_CategoriaToProducto_B_index" ON public."_CategoriaToProducto" USING btree ("B");


--
-- Name: pedido_historial_pedido_id_createdAt_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "pedido_historial_pedido_id_createdAt_idx" ON public.pedido_historial USING btree (pedido_id, "createdAt");


--
-- Name: pedido_historial_usuario_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX pedido_historial_usuario_id_idx ON public.pedido_historial USING btree (usuario_id);


--
-- Name: producto_componentes_componente_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX producto_componentes_componente_id_idx ON public.producto_componentes USING btree (componente_id);


--
-- Name: producto_componentes_producto_id_componente_id_variante_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX producto_componentes_producto_id_componente_id_variante_id_key ON public.producto_componentes USING btree (producto_id, componente_id, variante_id);


--
-- Name: producto_componentes_producto_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX producto_componentes_producto_id_idx ON public.producto_componentes USING btree (producto_id);


--
-- Name: producto_componentes_variante_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX producto_componentes_variante_id_idx ON public.producto_componentes USING btree (variante_id);


--
-- Name: DetallePedido DetallePedido_pedidoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DetallePedido"
    ADD CONSTRAINT "DetallePedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES public."Pedido"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DetallePedido DetallePedido_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DetallePedido"
    ADD CONSTRAINT "DetallePedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetallePedido DetallePedido_varianteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DetallePedido"
    ADD CONSTRAINT "DetallePedido_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES public."Variante"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Inventario Inventario_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inventario"
    ADD CONSTRAINT "Inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Pedido Pedido_turnoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES public."Turno"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Turno Turno_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Turno"
    ADD CONSTRAINT "Turno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Variante Variante_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Variante"
    ADD CONSTRAINT "Variante_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CategoriaToProducto _CategoriaToProducto_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."_CategoriaToProducto"
    ADD CONSTRAINT "_CategoriaToProducto_A_fkey" FOREIGN KEY ("A") REFERENCES public."Categoria"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CategoriaToProducto _CategoriaToProducto_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."_CategoriaToProducto"
    ADD CONSTRAINT "_CategoriaToProducto_B_fkey" FOREIGN KEY ("B") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pedido_historial pedido_historial_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pedido_historial
    ADD CONSTRAINT pedido_historial_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public."Pedido"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pedido_historial pedido_historial_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pedido_historial
    ADD CONSTRAINT pedido_historial_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: producto_componentes producto_componentes_componente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.producto_componentes
    ADD CONSTRAINT producto_componentes_componente_id_fkey FOREIGN KEY (componente_id) REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: producto_componentes producto_componentes_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.producto_componentes
    ADD CONSTRAINT producto_componentes_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: producto_componentes producto_componentes_variante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.producto_componentes
    ADD CONSTRAINT producto_componentes_variante_id_fkey FOREIGN KEY (variante_id) REFERENCES public."Variante"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ZIzRENAU2vgN4btsLA09hvZUKXzdc8T6s8iv90Xkv44g7YWLt3Uklg0n22jTwEx

