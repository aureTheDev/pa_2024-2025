#!/bin/bash

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_RESET='\033[0m'

header_info() {
    clear
    printf "${COLOR_GREEN}"
    cat <<"EOF"
  ______                                        ______                                                       __
 /      \                                      /      \                                                     |  \
|  $$$$$$\  ______    ______    ______        |  $$$$$$\  ______   _______   _______    ______    _______  _| $$_
| $$   \$$ |      \  /      \  /      \       | $$   \$$ /      \ |       \ |       \  /      \  /       \|   $$ \
| $$        \$$$$$$\|  $$$$$$\|  $$$$$$\      | $$      |  $$$$$$\| $$$$$$$\| $$$$$$$\|  $$$$$$\|  $$$$$$$ \$$$$$$
| $$   __  /      $$| $$   \$$| $$    $$      | $$   __ | $$  | $$| $$  | $$| $$  | $$| $$    $$| $$        | $$ __
| $$__/  \|  $$$$$$$| $$      | $$$$$$$$      | $$__/  \| $$__/ $$| $$  | $$| $$  | $$| $$$$$$$$| $$_____   | $$|  \
 \$$    $$ \$$    $$| $$       \$$     \       \$$    $$ \$$    $$| $$  | $$| $$  | $$ \$$     \ \$$     \   \$$  $$
  \$$$$$$   \$$$$$$$ \$$        \$$$$$$$        \$$$$$$   \$$$$$$  \$$   \$$ \$$   \$$  \$$$$$$$  \$$$$$$$    \$$$$
EOF
    printf "${COLOR_RESET}\n"
}

handle_result() {
    if [ "$1" -ne 0 ]; then
        printf "${COLOR_RED}[!] Error during step: %s${COLOR_RESET}\n" "$2" >&2
        exit 1
    else
        printf "${COLOR_GREEN}[+] %s: Success${COLOR_RESET}\n" "$2"
    fi
}

CURRENT_DIR_NAME=$(basename "$PWD")
if [ "$CURRENT_DIR_NAME" != "care-connect" ]; then
    printf "${COLOR_RED}[!] This script must be executed from the 'care-connect' directory (currently in '$CURRENT_DIR_NAME').${COLOR_RESET}\n" >&2
    exit 1
fi

if [ ! -f ".env" ]; then
    cat .env-template > .env
    handle_result $? "Creating .env file from .env-template"
    printf "${COLOR_GREEN}[+] Reminder: Please initialize your API keys.${COLOR_RESET}\n"
fi

header_info

if grep -q "export DOMAIN=" "$HOME/.bashrc"; then
    DOMAIN=$(grep "export DOMAIN=" "$HOME/.bashrc" | head -n1 | cut -d'=' -f2)
    printf "${COLOR_GREEN}[+] DOMAIN variable is already defined in .bashrc: %s${COLOR_RESET}\n" "$DOMAIN"
elif [ -z "$DOMAIN" ]; then
    read -rp "Enter your domain: " DOMAIN
    handle_result $? "Domain input"
    read -rp "Would you like to add DOMAIN to your .bashrc for persistence? (Y/n): " choice
    if [ "$choice" = "Y" ] || [ "$choice" = "y" ] || [ -z "$choice" ]; then
         echo "export DOMAIN=${DOMAIN}" >> "$HOME/.bashrc"
         handle_result $? "Adding DOMAIN to .bashrc"
         printf "${COLOR_GREEN}[+] DOMAIN variable added to .bashrc.${COLOR_RESET}\n"
    fi
else
    printf "${COLOR_GREEN}[+] DOMAIN variable already set in environment: %s${COLOR_RESET}\n" "$DOMAIN"
    read -rp "Would you like to add DOMAIN to your .bashrc for persistence? (Y/n): " choice
    if [ "$choice" = "Y" ] || [ "$choice" = "y" ] || [ -z "$choice" ]; then
         echo "export DOMAIN=${DOMAIN}" >> "$HOME/.bashrc"
         handle_result $? "Adding DOMAIN to .bashrc"
         printf "${COLOR_GREEN}[+] DOMAIN variable added to .bashrc.${COLOR_RESET}\n"
    fi
fi

export DOMAIN
handle_result $? "Exporting DOMAIN variable"

if grep -q "export NEXT_PUBLIC_STRIPE_PUBLIC_KEY=" "$HOME/.bashrc"; then
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY=$(grep "export NEXT_PUBLIC_STRIPE_PUBLIC_KEY=" "$HOME/.bashrc" | head -n1 | cut -d'=' -f2)
    printf "${COLOR_GREEN}[+] NEXT_PUBLIC_STRIPE_PUBLIC_KEY is already defined in .bashrc: %s${COLOR_RESET}\n" "$NEXT_PUBLIC_STRIPE_PUBLIC_KEY"
elif [ -z "$NEXT_PUBLIC_STRIPE_PUBLIC_KEY" ]; then
    read -rp "Enter your NEXT_PUBLIC_STRIPE_PUBLIC_KEY: " NEXT_PUBLIC_STRIPE_PUBLIC_KEY
    handle_result $? "Stripe public key input"
    read -rp "Would you like to add NEXT_PUBLIC_STRIPE_PUBLIC_KEY to your .bashrc for persistence? (Y/n): " choice
    if [ "$choice" = "Y" ] || [ "$choice" = "y" ] || [ -z "$choice" ]; then
         echo "export NEXT_PUBLIC_STRIPE_PUBLIC_KEY=${NEXT_PUBLIC_STRIPE_PUBLIC_KEY}" >> "$HOME/.bashrc"
         handle_result $? "Adding NEXT_PUBLIC_STRIPE_PUBLIC_KEY to .bashrc"
         printf "${COLOR_GREEN}[+] NEXT_PUBLIC_STRIPE_PUBLIC_KEY added to .bashrc.${COLOR_RESET}\n"
    fi
else
    printf "${COLOR_GREEN}[+] NEXT_PUBLIC_STRIPE_PUBLIC_KEY is already set in environment: %s${COLOR_RESET}\n" "$NEXT_PUBLIC_STRIPE_PUBLIC_KEY"
    read -rp "Would you like to add NEXT_PUBLIC_STRIPE_PUBLIC_KEY to your .bashrc for persistence? (Y/n): " choice
    if [ "$choice" = "Y" ] || [ "$choice" = "y" ] || [ -z "$choice" ]; then
         echo "export NEXT_PUBLIC_STRIPE_PUBLIC_KEY=${NEXT_PUBLIC_STRIPE_PUBLIC_KEY}" >> "$HOME/.bashrc"
         handle_result $? "Adding NEXT_PUBLIC_STRIPE_PUBLIC_KEY to .bashrc"
         printf "${COLOR_GREEN}[+] NEXT_PUBLIC_STRIPE_PUBLIC_KEY added to .bashrc.${COLOR_RESET}\n"
    fi
fi

export NEXT_PUBLIC_STRIPE_PUBLIC_KEY
handle_result $? "Exporting NEXT_PUBLIC_STRIPE_PUBLIC_KEY variable"


envsubst '$DOMAIN' < nginx/nginx-template.conf > nginx/nginx.conf
handle_result $? "Substituting variables in nginx/nginx.conf"


if grep -q "^alias clonethis=" "$HOME/.bash_aliases"; then
    printf "${COLOR_GREEN}[+] Alias for 'clonethis' already exists in .bash_aliases. Skipping alias creation.${COLOR_RESET}\n"
else
    read -rp "Enter alias command for 'clonethis' (leave empty to skip): " ALIAS_CMD
    if [ -n "$ALIAS_CMD" ]; then
        echo "alias clonethis='${ALIAS_CMD}'" >> "$HOME/.bash_aliases"
        handle_result $? "Saving alias for clonethis in .bash_aliases"
        printf "${COLOR_GREEN}[+] Alias for 'clonethis' saved. Please reload your terminal or run 'source ~/.bash_aliases' to apply it.${COLOR_RESET}\n"
    fi
fi



# -------------------------------------------------------------------
# Section: Let's Encrypt certificate generation and nginx reload
# -------------------------------------------------------------------

domains=(
    "$DOMAIN"
    "www.$DOMAIN"
    "api.$DOMAIN")
rsa_key_size=4096
data_path="./nginx/certbot"
email="${SSL_EMAIL:-terangui879@tersi.com}" # Adding a valid address is strongly recommended
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

if [ -d "$data_path" ]; then
    read -p "Existing data found for $domains. Continue and replace existing certificate? (y/N) " decision
    if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
        exit
    fi
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
    echo "### Downloading recommended TLS parameters ..."
    mkdir -p "$data_path/conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf >"$data_path/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem >"$data_path/conf/ssl-dhparams.pem"
    echo
fi

echo "### Creating dummy certificate for $domains ..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
docker compose -f "docker-compose.yml" run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Starting nginx ..."
docker compose -f "docker-compose.yml" up --force-recreate -d nginx
echo

echo "### Deleting dummy certificate for $domains ..."
docker compose -f "docker-compose.yml" run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo

echo "### Requesting Let's Encrypt certificate for $domains ..."
# Join $domains to -d args
domain_args=""
for domain in "${domains[@]}"; do
    domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
    "") email_arg="--register-unsafely-without-email" ;;
    *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker compose -f "docker-compose.yml" run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
docker compose -f "docker-compose.yml" exec nginx nginx -s reload
