# Clownfish Hoppin

A [Clownfish](https://kennyon.fandom.com/wiki/Clownfish) themed [discord bot](https://discord.com/developers/applications) that randomly replies to you saying "that's why i'm hopping"

## How to run (Standalone)

### Prerequisites
- Have [docker](https://docs.docker.com/desktop/) installed

### Steps

1. Download [this](https://github.com/summerwya/clownfish-hopping/archive/refs/heads/main.zip) repo and extract
2. Open the main folder where all the code is in
3. Rename [.env.example](.env.example) to `.env`
4. Edit the contents of `.env` to have your [discord bot](https://discord.com/developers/applications)'s login information (And an optional channel that tells you if Groupie's started or not)
5. Open a terminal in there and run:
  * `docker compose up --build`
  * *Or* `docker compose up --build -d` *to run the bot in the background, you can stop it by using docker desktop or docker-cli* 
6. Done!


> *I do not own the OC "Clownfish" and they were made by [YonKaGor](https://www.youtube.com/@YonKaGor)*
