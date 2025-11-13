# this repo
was an attempt to provide our plugins in mu compatible format, but due to time constraints, limited flexibility of this approach and the incompatible format of most plugins (can't be run as mu), we switched the approach to hold the User test deadline.

## fallback solution
The plugins in here are downloaded by Team Apollo, deployed to sfs and on account creation the bundle (as it was when the current sfs ui version was built), are uploaded to wp-content/plugins of the wordpress account via the file upload API.
the wpscan_token and active_plugins wp_options are manipulated through the config API so that the plugins are active.
the extendable theme is downloaded and activated on the first request.

that makes our plugins appear in the NMWP accounts and lead to a successfull user testing session :)
