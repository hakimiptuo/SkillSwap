require_relative 'boot'
require 'rails/all'
Bundler.require(*Rails.groups)

module SkillSwap
  class Application < Rails::Application
    config.load_defaults 8.1
    config.autoload_lib(ignore: %w[assets tasks]) if config.respond_to?(:autoload_lib)
    config.time_zone = 'Asia/Kuala_Lumpur'
    config.active_record.default_timezone = :utc
    config.action_controller.default_protect_from_forgery = true
    config.session_store :cookie_store, key: '_skillswap_session', same_site: :lax, secure: ENV['COOKIE_SECURE'] == 'true'
    config.hosts.clear # Docker course demo; restrict to a known domain for public production hosting.
  end
end
