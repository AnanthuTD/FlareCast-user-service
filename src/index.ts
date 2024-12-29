import app from "./app";
import env from "./env";

const start = async () => {
	try {
		app.listen(env.PORT, () => {
			console.info(`Server running at http://localhost:${env.PORT}`);
		});
	} catch (err) {
		console.error(`Error starting the server: ${(err as Error).message}`);
	}
};

start();
