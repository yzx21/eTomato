const axios = require('axios');
require('dotenv').config();
const apiKey = process.env.OPENAI_API_KEY;

class ChatApp {
    constructor() {
        this.messages = [
            { role: 'system', content: 'You are a helpful assistant.' },
        ];
    }

    async chat(message) {
        this.messages.push({ role: 'user', content: message });
        const response = await axios.post(
            'https://api.openai.com/v1/engines/davinci-codex/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: this.messages,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                }
            }
        )
            .catch(function (error) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                } else if (error.request) {
                    // The request was made but no response was received
                    console.log(error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                }
            });
        this.messages.push({ role: 'assistant', content: response.data.choices[0].message.content });
        return response.data.choices[0].message.content;
    }
}


chatapp = new ChatApp()
chatapp.chat("hi")