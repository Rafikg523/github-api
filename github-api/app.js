
async getUser() {
    try {
        const respone = await fetch(`https://api.github.com/user`);
        const data = await respone.json();

        console.log(data);
    } catch (error) {
        console.error(error);
    }
}


async function main() {
    getUser();
}