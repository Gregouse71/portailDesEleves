<?php
$current_page = basename($_SERVER['PHP_SELF']);
?>
<!--
Author: W3layouts
Author URL: http://w3layouts.com
License: Creative Commons Attribution 3.0 Unported
License URL: http://creativecommons.org/licenses/by/3.0/
-->
<!DOCTYPE html>
<html lang="fr">
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
	<link rel="shortcut icon" href="/images/favicon.ico">
	<!-- js -->
	<script src="js/jquery-1.11.1.min.js"></script>
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
								<li><a href="index.php" <?php if($current_page == 'index.php') echo 'class="active"'; ?>>Accueil</a></li>
								<li><a href="https://www.eleves.mines-paris.eu">Élèves</a></li>
								<li><a href="admissibles.php" <?php if($current_page == 'admissibles.php') echo 'class="active"'; ?>>La vie aux Mines</a></li>
								<li><a href="entreprises.php" <?php if($current_page == 'entreprises.php') echo 'class="active"'; ?>>Entreprises</a></li>
								<li><a href="cours.php" <?php if($current_page == 'cours.php') echo 'class="active"'; ?>>Cours particuliers</a></li>
							</ul>
						</nav>
					</div>
					<!-- /.navbar-collapse -->
				</nav>
			</div>
		</div>
	</div>
	<!-- //bannner -->
