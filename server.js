const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Comprehensive CORS configuration
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Preflight request handler
app.options('*', cors());

app.post('/proxy', async (req, res) => {
	const {
		url,
		method = 'GET',
		headers = {},
		body = null,
		contentType = 'application/json'
	} = req.body;

	if (!url) {
		return res.status(400).json({ error: 'URL is required' });
	}

	try {
		const requestConfig = {
			method,
			url,
			headers: {
				'Content-Type': contentType,
				...headers
			},
			transformRequest: [data => {
				if (data === null) return null;
				switch (contentType) {
					case 'application/json':
						return typeof data === 'string'
							? data
							: JSON.stringify(data);
					case 'application/x-www-form-urlencoded':
						return typeof data === 'string'
							? data
							: new URLSearchParams(data).toString();
					case 'text/plain':
					case 'application/xml':
					default:
						return data;
				}
			}],
			transformResponse: [data => {
				try {
					return JSON.parse(data);
				} catch {
					return data;
				}
			}],
			data: body
		};

		const response = await axios(requestConfig);

		res.json({
			status: response.status,
			headers: response.headers,
			data: response.data
		});
	} catch (error) {
		res.status(error.response?.status || 500).json({
			error: error.message,
			details: error.response?.data
		});
	}
});

app.use('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Proxy server running on port ${PORT}`);
});