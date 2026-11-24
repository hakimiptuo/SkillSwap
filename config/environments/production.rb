
Rails.application.configure do
  # Production performance
  config.enable_reloading = false
  config.eager_load = true

  # Error handling
  config.consider_all_requests_local = false

  # Production logging
  config.log_level = :info
  config.log_tags = [:request_id]
  config.logger = ActiveSupport::TaggedLogging.logger(STDOUT)

  # Serve SkillSwap CSS, JavaScript and public files
  config.public_file_server.enabled = true

  # Active Storage configuration
  config.active_storage.service = :local

  # Enable HTTPS only when configured
  # behind a trusted HTTPS reverse proxy
  config.force_ssl = ENV['FORCE_SSL'] == 'true'
end
