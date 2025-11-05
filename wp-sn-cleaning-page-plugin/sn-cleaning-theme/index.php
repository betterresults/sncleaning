<?php
/**
 * The main template file (fallback)
 * 
 * @package SN_Cleaning
 */

get_header(); ?>

<main id="main-content" class="min-h-screen bg-background py-20">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl font-bold text-foreground mb-8">
                <?php _e('Welcome to SN Cleaning Services', 'sn-cleaning'); ?>
            </h1>
            
            <?php if (have_posts()) : ?>
                <?php while (have_posts()) : the_post(); ?>
                    <article id="post-<?php the_ID(); ?>" <?php post_class('mb-12'); ?>>
                        <h2 class="text-2xl font-semibold mb-4">
                            <a href="<?php the_permalink(); ?>" class="text-primary hover:text-primary-dark transition-colors">
                                <?php the_title(); ?>
                            </a>
                        </h2>
                        <div class="prose max-w-none">
                            <?php the_excerpt(); ?>
                        </div>
                    </article>
                <?php endwhile; ?>
            <?php else : ?>
                <p><?php _e('No content found. Please add a page or assign a template.', 'sn-cleaning'); ?></p>
            <?php endif; ?>
        </div>
    </div>
</main>

<?php get_footer(); ?>
