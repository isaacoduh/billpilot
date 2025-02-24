ARG NODE_VERSION=16-alpine3.12

FROM node:${NODE_VERSION}

LABEL name="billpilot"
LABEL license="MIT"
LABEL description="Billpilot Invoicing and Business Finance Image"

ENV NODE_ENV=development

ARG APP_HOME=/app

WORKDIR ${APP_HOME}

RUN addgroup --system billpilot \
    && adduser --system --ingroup billpilot billpilot

COPY package.json ./

RUN npm install

COPY --chown=billpilot:billpilot . ${APP_HOME}

RUN chown billpilot:billpilot ${APP_HOME}

USER billpilot

CMD [ "npm","run","dev" ]