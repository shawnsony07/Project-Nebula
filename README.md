
# Project Nebula

The Exoplanet 3D Star Map Web Application is a tool that serves as an exoplanet and stars visualizer in 3D space. It is a technology made with Flask for the backend of the application and Three.js for 3D rendering, which uses the real-time exoplanetary data gained from NASA's Exoplanet Archive and star data from the Gaia database.


## API Reference

#### Get Exoplanet Data

```http
  GET /api/exoplanets/${planet_name}

```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `planet_name` | `string` | **Required**:The name of the exoplanet to fetch data for. |

#### Get Star data

```http
  GET /api/stars/${planet_name}

```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `planet_name`      | `string` | **Required**:The name of the exoplanet to fetch data for. |

#### Chat with AI

```http
  POST /api/chat

```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `message`      | `string` | **Required**:User message to send to the chatbot. |
| `api_key`      | `string` | **Required**:Your API key for OpenAI. |



## Deployment

To deploy this project run

```bash
  python app.py
```


## Run Locally

Clone the project

```bash
  git clone https://github.com/shawnsony07/Project-Nebula.git
```

Go to the project directory

```bash
  cd Project-Nebula
```

Install python dependencies

```bash
  pip install -r requirements.txt

```

Start the server

```bash
  python app.py
```


## Badges

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)


## License

[MIT](https://choosealicense.com/licenses/mit/)

