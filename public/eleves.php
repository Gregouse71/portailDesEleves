<!--
Author: W3layouts
Author URL: http://w3layouts.com
License: Creative Commons Attribution 3.0 Unported
License URL: http://creativecommons.org/licenses/by/3.0/
-->
<!DOCTYPE html>
<html>
<head>
	<title>Le Portail des élèves</title>
	<!-- for-mobile-apps -->
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<script type="application/x-javascript"> addEventListener("load", function() { setTimeout(hideURLbar, 0); }, false);
	function hideURLbar(){ window.scrollTo(0,1); } </script>
	<!-- //for-mobile-apps -->
	<link href="css/bootstrap.css" rel="stylesheet" type="text/css" media="all" />
	<link href="css/style.css" rel="stylesheet" type="text/css" media="all" />
	<!-- js -->
	<script src="js/jquery-1.11.1.min.js"></script>
	<link rel="shortcut icon" href="/images/favicon.ico">
	<!-- //js -->
	<link href='//fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,600,600italic,700,700italic,800,800italic' rel='stylesheet' type='text/css'>
	<link href='https://fonts.googleapis.com/css?family=Dancing+Script' rel='stylesheet' type='text/css'>
</head>

<body>
	<!-- bannner -->
	<div class="banner1">
		<div class="container">
			<div class="logo">
				<a href="index.php">Portail des Élèves</a>
			</div>
			<div class="navigation">
				<nav class="navbar navbar-default">
					<!-- Brand and toggle get grouped for better mobile display -->
					<div class="navbar-header">
						<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
							<span class="sr-only">Toggle navigation</span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
						</button>
					</div>

					<!-- Collect the nav links, forms, and other content for toggling -->
					<div class="collapse navbar-collapse nav-wil" id="bs-example-navbar-collapse-1">
						<nav class="cl-effect-13" id="cl-effect-13">
							<ul class="nav navbar-nav">
								<li><a href="index.php">Accueil</a></li>
								<li><a href="https://www.eleves.mines-paris.eu">Élèves</a></li>
								<li><a href="admissibles.php">La vie aux Mines</a></li>
								<li><a href="entreprises.php">Entreprises</a></li>
								<li><a href="cours.php">Cours particuliers</a></li>
							</ul>
						</nav>
					</div>
					<!-- /.navbar-collapse -->
				</nav>
			</div>
		</div>
	</div>
	<!-- //bannner -->
	<div class="container">

		<br>
		<div id="content">
		<!--<iframe src="http://www.eleves.mines-paris.eu/sso/1y1b/authentication_accueil" width="100%" style="border:none;" scrolling="no"></iframe>-->
		<iframe src="https://www.eleves.mines-paris.eu/" width="100%" style="border:none;" scrolling="no"></iframe>
		</div>
	</div>
<!-- banner-bottom -->


	<!-- footer -->
	<div class="footer">
		<div class="container">
			<div class="footer-grids">
				<div class="footer-bottom">
					<div class="footer-bottom-left">
						<p>Copyright &copy; 2016 Inventor. All Rights Reserved.</p>
					</div>
					<div class="footer-bottom-right">
						<p>En cas de problème ou de question, contactez le <a href="mailto:webmaster-bde@mines-paristech.fr">VP Geek (webmaster-bde@mines-paristech.fr)</a></p>
					</div>
					<div class="clearfix"> </div>
				</div>
			</div>
		</div>
	</div>
	<!-- //footer -->
	<!-- for bootstrap working -->
	<script src="js/bootstrap.js"></script>
	<!-- //for bootstrap working -->


	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
		<script type="text/javascript" src="js/iframeResizer.min.js"></script>
		<script type="text/javascript">

			/*
			 * If you do not understand what the code below does, then please just use the
			 * following call in your own code.
			 *
			 *   iFrameResize({log:true});
			 *
			 * Once you have it working, set the log option to false.
			 */

			iFrameResize({
				log                     : true,                  // Enable console logging
				inPageLinks             : true,
				resizedCallback         : function(messageData){ // Callback fn when resize is received
					$('p#callback').php(
						'<b>Frame ID:</b> '    + messageData.iframe.id +
						' <b>Height:</b> '     + messageData.height +
						' <b>Width:</b> '      + messageData.width +
						' <b>Event type:</b> ' + messageData.type
					);
				},
				messageCallback         : function(messageData){ // Callback fn when message is received
					$('p#callback').php(
						'<b>Frame ID:</b> '    + messageData.iframe.id +
						' <b>Message:</b> '    + messageData.message
					);
					alert(messageData.message);
					document.getElementsByTagName('iframe')[0].iFrameResizer.sendMessage('Hello back from parent page');
				},
				closedCallback         : function(id){ // Callback fn when iFrame is closed
					$('p#callback').php(
						'<b>IFrame (</b>'    + id +
						'<b>) removed from page.</b>'
					);
				}
			});

		</script>
</body>
</html>
