FROM ruby:3.3-slim

ENV APP_HOME=/skillswap \
    BUNDLE_WITHOUT=production \
    RAILS_ENV=development \
    RAILS_LOG_TO_STDOUT=true

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
       build-essential default-libmysqlclient-dev pkg-config libyaml-dev \
       libssl-dev curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR $APP_HOME
COPY Gemfile ./
RUN bundle install
COPY . .
RUN mkdir -p tmp log
EXPOSE 3000
CMD ["bash", "-lc", "bundle exec ruby bin/rails db:prepare && bundle exec ruby bin/rails server -b 0.0.0.0 -p 3000"]